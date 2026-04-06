import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type User } from '../services/auth.service';



interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  updateUser: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => undefined,
  updateUser: () => undefined,
  logout: () => undefined,
  isLoading: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      // Skip verification if we just logged in (to avoid redundant API calls)
      const skipVerification = localStorage.getItem('skip_auth_verification');
      if (skipVerification) {
        localStorage.removeItem('skip_auth_verification');
        // Still restore from localStorage if available
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            localStorage.removeItem('user');
          }
        }
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Verify token by fetching current user with a short timeout (5s)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const currentUser = await authService.getCurrentUser();
            clearTimeout(timeoutId);
            setUser(currentUser);
          } catch (timeoutError) {
            clearTimeout(timeoutId);
            throw timeoutError;
          }
        } catch (error: unknown) {
          const authError = error as { code?: string; message?: string; response?: { status?: number } };
          // Only log timeout errors, don't invalidate token for other errors
          if (authError.code === 'ECONNABORTED' || authError.message?.includes('timeout')) {
            console.warn('Token verification timeout (backend may be offline). Using cached session.');
            // Fall back to cached user data
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              try {
                setUser(JSON.parse(savedUser));
              } catch (e) {
                localStorage.removeItem('user');
              }
            }
          } else if (authError.response?.status === 401) {
            // Only clear on actual auth failure
            console.error('Token invalid:', authError);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUser(null);
          } else {
            console.error('Failed to verify token:', authError);
          }
        }
      } else {
        // Fallback to local storage user if no token check (legacy) or just clear
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            localStorage.removeItem('user');
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, updateUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};



/**
 * useAuth Hook
 * 
 * Custom hook for authentication state and operations.
 * Provides centralized authentication logic.
 */

import { useState, useEffect, useCallback } from 'react';
import type { UseAuthReturn, RegisterData } from '@/types/hooks';
import type { User } from '@/types/models';
import type { ApiError, LoginResponse } from '@/types/api';
import apiClient, { getErrorMessage } from '@/lib/api';

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiClient.post<LoginResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = response.data;

      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      // Use user from login response when available to avoid an extra request.
      if (data.user) {
        setUser(data.user);
      } else {
        const userResponse = await apiClient.get('/auth/me');
        setUser(userResponse.data);
      }
    } catch (err) {
      const apiError = { message: getErrorMessage(err) } as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/register', data);
      // Auto-login after registration
      await login(data.email, data.password);
    } catch (err) {
      const apiError = { message: getErrorMessage(err) } as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [login]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
}

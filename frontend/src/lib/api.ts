import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { toast } from '../components/ui/Toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Axios instance with interceptors for error handling
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add auth token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token if available
    const csrfToken = getCookie('csrf_token');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 5xx and Network Errors globally
    if (!error.response || error.response.status >= 500) {
      const message = getErrorMessage(error);
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

/**
 * Get user-friendly error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Network error
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'Request timed out. Please try again.';
      }
      if (!navigator.onLine) {
        return 'No internet connection. Please check your network.';
      }
      return 'Unable to connect to server. Please try again later.';
    }

    // HTTP error responses
    const status = error.response.status;
    const data = error.response.data as any;

    // Use server error message if available
    if (data?.detail) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }

      // Handle array of errors (e.g. FastAPI validation errors)
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((d: any) => {
            if (typeof d === 'string') return d;
            const message = d.msg || d.message || d.error || JSON.stringify(d);

            // Handle custom 'field' property from backend (e.g. "body.username")
            if (d.field && typeof d.field === 'string') {
              const parts = d.field.split('.');
              const field = parts[parts.length - 1];
              if (field && field !== 'body') {
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                return `${fieldName}: ${message}`;
              }
            }

            // Append field name if available from standard 'loc'
            if (d.loc && Array.isArray(d.loc) && d.loc.length > 0) {
              const field = d.loc[d.loc.length - 1];
              if (typeof field === 'string') {
                // Skip 'body' if it's the only location, but keep it if it's part of a path like ['body', 'username']
                if (field === 'body' && d.loc.length === 1) return message;

                const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                return `${fieldName}: ${message}`;
              }
            }
            return message;
          })
          .join(', ');
      }

      // Handle object errors
      if (typeof data.detail === 'object' && data.detail !== null) {
        if (data.detail.message) return data.detail.message;
        if (data.detail.msg) return data.detail.msg;
        if (data.detail.error) return data.detail.error;
        // Fallback for unknown object structure
        try {
          return JSON.stringify(data.detail);
        } catch (e) {
          return "Unknown error details";
        }
      }
    }

    // Default messages by status code
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission to do that.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please slow down.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return `An error occurred (${status}). Please try again.`;
    }
  }

  // Non-Axios errors
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Helper to get cookie value
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// AI Types
export interface ResumeSection {
  title: string;
  content: string[];
}

export interface StructuredResume {
  summary: string;
  skills: string[];
  experience: ResumeSection[];
  education: ResumeSection[];
  projects?: ResumeSection[];
}

export default apiClient;

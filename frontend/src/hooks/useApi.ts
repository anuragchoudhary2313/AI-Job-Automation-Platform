import { useState, useCallback } from 'react';
import apiClient, { getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { AxiosRequestConfig } from 'axios';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

/**
 * Custom hook for API calls with automatic error handling
 */
export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const execute = useCallback(
    async (config: AxiosRequestConfig) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient(config);
        setData(response.data);

        if (options.showSuccessToast && options.successMessage) {
          toast.success(options.successMessage);
        }

        if (options.onSuccess) {
          options.onSuccess(response.data);
        }

        return response.data;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);

        if (options.showErrorToast !== false) {
          toast.error(errorMessage);
        }

        if (options.onError) {
          options.onError(errorMessage);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options, toast]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook for API calls with retry functionality
 */
export function useApiWithRetry<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  const [retryCount, setRetryCount] = useState(0);
  const [lastConfig, setLastConfig] = useState<AxiosRequestConfig | null>(null);

  const execute = useCallback(
    async (config: AxiosRequestConfig) => {
      setLastConfig(config);
      setRetryCount(0);
      return api.execute(config);
    },
    [api]
  );

  const retry = useCallback(async () => {
    if (lastConfig) {
      setRetryCount((prev) => prev + 1);
      return api.execute(lastConfig);
    }
  }, [lastConfig, api]);

  return {
    ...api,
    execute,
    retry,
    retryCount,
    canRetry: !!lastConfig && !!api.error,
  };
}

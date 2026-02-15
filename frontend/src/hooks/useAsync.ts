/**
 * useAsync Hook
 * 
 * Generic hook for managing async operation state.
 * Handles loading, error, and data states.
 */

import { useState, useCallback } from 'react';
import type { AsyncState } from '@/types/hooks';
import type { ApiError } from '@/types/api';

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const error = err as ApiError;
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

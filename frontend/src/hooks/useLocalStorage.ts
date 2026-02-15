/**
 * useLocalStorage Hook
 * 
 * Type-safe local storage hook with automatic JSON serialization.
 */

import { useState, useEffect, useCallback } from 'react';
import type { UseLocalStorageReturn } from '@/types/hooks';

export function useLocalStorage<T>(key: string, initialValue?: T): UseLocalStorageReturn<T> {
  const [value, setValue] = useState<T | null>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue ?? null;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue ?? null;
    }
  });

  const setStoredValue = useCallback((newValue: T) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      setValue(null);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  return {
    value,
    setValue: setStoredValue,
    removeValue,
  };
}

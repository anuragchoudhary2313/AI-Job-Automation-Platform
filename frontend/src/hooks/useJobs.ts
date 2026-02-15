/**
 * useJobs Hook
 * 
 * Custom hook for job data fetching and mutations.
 * Provides CRUD operations for jobs with loading states.
 */

import { useState, useEffect, useCallback } from 'react';
import type { UseJobsReturn } from '@/types/hooks';
import type { Job } from '@/types/models';
import type { ApiError } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function useJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/jobs/`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw {
          message: 'Failed to fetch jobs',
          status: response.status,
        };
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const createJob = useCallback(async (data: Partial<Job>): Promise<Job> => {
    try {
      const response = await fetch(`${API_URL}/jobs/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          message: errorData.detail || 'Failed to create job',
          status: response.status,
        };
      }

      const newJob = await response.json();
      setJobs(prev => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    }
  }, []);

  const updateJob = useCallback(async (id: number, data: Partial<Job>): Promise<Job> => {
    try {
      const response = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          message: errorData.detail || 'Failed to update job',
          status: response.status,
        };
      }

      const updatedJob = await response.json();
      setJobs(prev => prev.map(job => job.id === id ? updatedJob : job));
      return updatedJob;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    }
  }, []);

  const deleteJob = useCallback(async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          message: errorData.detail || 'Failed to delete job',
          status: response.status,
        };
      }

      setJobs(prev => prev.filter(job => job.id !== id));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    }
  }, []);

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    refetch: fetchJobs,
  };
}

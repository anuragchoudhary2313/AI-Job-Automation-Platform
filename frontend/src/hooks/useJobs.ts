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
import apiClient, { getErrorMessage } from '@/lib/api';

export function useJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/jobs/');
      setJobs(response.data);
    } catch (err) {
      setError({ message: getErrorMessage(err) } as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const createJob = useCallback(async (data: Partial<Job>): Promise<Job> => {
    try {
      const response = await apiClient.post('/jobs/', data);
      const newJob = response.data;
      setJobs(prev => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      const apiError = { message: getErrorMessage(err) } as ApiError;
      setError(apiError);
      throw apiError;
    }
  }, []);

  const updateJob = useCallback(async (id: string, data: Partial<Job>): Promise<Job> => {
    try {
      const response = await apiClient.put(`/jobs/${id}`, data);
      const updatedJob = response.data;
      setJobs(prev => prev.map(job => job.id === id ? updatedJob : job));
      return updatedJob;
    } catch (err) {
      const apiError = { message: getErrorMessage(err) } as ApiError;
      setError(apiError);
      throw apiError;
    }
  }, []);

  const deleteJob = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/jobs/${id}`);
      setJobs(prev => prev.filter(job => job.id !== id));
    } catch (err) {
      const apiError = { message: getErrorMessage(err) } as ApiError;
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

/**
 * Hook Return Types
 * 
 * Type definitions for custom hook return values.
 */

import { User, Job, Resume, Stats } from './models';
import { ApiError } from './api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: ApiError | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  isAuthenticated: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: ApiError | null;
  createJob: (data: Partial<Job>) => Promise<Job>;
  updateJob: (id: number, data: Partial<Job>) => Promise<Job>;
  deleteJob: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseResumesReturn {
  resumes: Resume[];
  loading: boolean;
  error: ApiError | null;
  uploadResume: (file: File) => Promise<Resume>;
  deleteResume: (id: number) => Promise<void>;
  downloadResume: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseStatsReturn {
  stats: Stats | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export interface UseWebSocketReturn {
  connected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
}

export interface UseLocalStorageReturn<T> {
  value: T | null;
  setValue: (value: T) => void;
  removeValue: () => void;
}

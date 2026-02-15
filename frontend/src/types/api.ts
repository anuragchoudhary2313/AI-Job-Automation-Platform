/**
 * API Response Types
 * 
 * Type definitions for API responses and requests.
 */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  team_id?: number;
}

export interface JobCreateRequest {
  title: string;
  company: string;
  location?: string;
  description?: string;
  url?: string;
  salary?: string;
  status?: string;
  source?: string;
  match_score?: number;
}

export interface JobUpdateRequest {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  salary?: string;
  status?: string;
}

export interface ResumeCreateRequest {
  title: string;
  content?: string;
  file_path?: string;
  job_id?: number;
}

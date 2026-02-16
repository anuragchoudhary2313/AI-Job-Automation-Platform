/**
 * Domain Model Types
 * 
 * Type definitions for domain models matching backend schemas.
 */

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  url?: string;
  salary?: string;
  status: JobStatus;
  source?: string;
  match_score?: number;
  team_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type JobStatus = 'pending' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Resume {
  id: string;
  user_id: string;
  content?: string;
  file_path?: string;
  filename?: string;
  template?: string;
  job_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Log {
  id: string;
  level: LogLevel;
  message: string;
  source?: string;
  team_id?: string;
  user_id?: string;
  created_at: string;
}

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface Stats {
  total_applied: number;
  emailed: number;
  shortlisted: number;
  rejected: number;
  success_rate: number;
  daily_activity: DailyActivity[];
  status_distribution: StatusDistribution[];
}

export interface DailyActivity {
  date: string;
  jobs: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
}

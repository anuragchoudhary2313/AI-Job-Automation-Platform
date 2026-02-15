import apiClient from '../lib/api';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  source: string;
  url: string;
  salary_range?: string;
  date_posted?: string;
  status: 'new' | 'applied' | 'interviewing' | 'rejected' | 'offer';
  applied_at?: string;
}

export interface JobFilters {
  status?: string;
  source?: string;
  limit?: number;
  skip?: number;
  search?: string;
  sort?: string;
}

export const jobService = {
  async getStats(): Promise<any> {
    const response = await apiClient.get<any>('/jobs/stats');
    return response.data;
  },

  async getJobs(filters?: JobFilters): Promise<Job[]> {
    const response = await apiClient.get<Job[]>('/jobs', { params: filters });
    return response.data;
  },

  async getJob(id: string): Promise<Job> {
    const response = await apiClient.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const response = await apiClient.post<Job>('/jobs', jobData);
    return response.data;
  },

  async updateJob(id: string, jobData: Partial<Job>): Promise<Job> {
    const response = await apiClient.put<Job>(`/jobs/${id}`, jobData);
    return response.data;
  },

  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`/jobs/${id}`);
  },

  async scrapeJobs(keyword: string, location: string, limit: number = 5): Promise<{ message: string; jobs_found: number }> {
    const response = await apiClient.post('/jobs/scrape', null, {
      params: { keyword, location, limit },
    });
    return response.data;
  },
};

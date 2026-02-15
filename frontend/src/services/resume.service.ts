import apiClient from '../lib/api';

export interface Resume {
  id: string;
  user_id: string;
  team_id: string;
  file_url: string;
  parsed_data: any;
  created_at: string;
  updated_at?: string;
}

export const resumeService = {
  async getResumes(): Promise<Resume[]> {
    const response = await apiClient.get<Resume[]>('/resumes');
    return response.data;
  },

  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<Resume>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteResume(id: string): Promise<void> {
    await apiClient.delete(`/resumes/${id}`);
  },

  async downloadResume(id: string): Promise<Blob> {
    const response = await apiClient.get(`/resumes/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async parseResume(id: string): Promise<any> {
    const response = await apiClient.post<any>(`/resumes/${id}/parse`);
    return response.data;
  },

  async generateTailoredResume(jobId: string, baseResumeId: string): Promise<Resume> {
    const response = await apiClient.post<Resume>('/resumes/generate', {
      job_id: jobId,
      base_resume_id: baseResumeId
    });
    return response.data;
  }
};

/**
 * useResumes Hook
 * 
 * Custom hook for resume operations.
 * Provides upload, download, and delete functionality.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeService } from '../services/resume.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../lib/api';

export function useResumes() {
  const queryClient = useQueryClient();

  const { data: resumes = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getResumes()
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeService.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume uploaded successfully');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeService.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume deleted successfully');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    }
  });

  const downloadResume = async (id: string, fileName: string = 'resume.pdf') => {
    try {
      const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      const blob = await resumeService.downloadResume(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      
      // Delay revoking the object URL to allow the browser to initiate the download with the correct filename.
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return {
    resumes,
    loading,
    error,
    uploadResume: uploadMutation.mutateAsync,
    deleteResume: deleteMutation.mutateAsync,
    downloadResume,
    refetch,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ExternalLink, Plus, Loader2, Sparkles } from 'lucide-react';
import apiClient from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';

interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  created_at: string;
}

export function ScrapedJobsList() {
  const queryClient = useQueryClient();

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['scraped-jobs'],
    queryFn: async () => {
      const response = await apiClient.get<ScrapedJob[]>('/jobs/scraped', {
        params: { limit: 5 }
      });
      return response.data;
    },
    refetchInterval: 10000, // Poll every 10s for new results while scraping
  });

  const importMutation = useMutation({
    mutationFn: async (job: ScrapedJob) => {
      return apiClient.post('/jobs', {
        title: job.title,
        company: job.company,
        location: job.location,
        job_url: job.link,
        description: 'Imported from LinkedIn search results.',
        status: 'pending'
      });
    },
    onSuccess: (response) => {
      const data = response.data;
      if (data.created) {
        toast.success(data.message || 'Added to your applications!');
      } else {
        toast.info(data.message || 'This job is already in your applications.');
      }
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add job');
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return null; // Don't show if empty
  }

  return (
    <Card className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Recently Scraped Opportunities
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 text-xs">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.map((job, index) => (
            <div
              key={job.id || `scraped-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-900 dark:text-gray-100">{job.title}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {job.company} • {job.location}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(job.link, '_blank')}
                  title="View Original"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 border-blue-200 hover:bg-blue-50 text-blue-700"
                  onClick={() => importMutation.mutate(job)}
                  disabled={importMutation.isPending}
                >
                  <Plus className="h-3.3 w-3.5" />
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

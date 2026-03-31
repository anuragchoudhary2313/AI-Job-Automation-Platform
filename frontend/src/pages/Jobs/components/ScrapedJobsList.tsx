import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ExternalLink, Plus, Loader2, Sparkles, MapPin, Building2 } from 'lucide-react';
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

interface ScrapedJobsListProps {
  onApply?: () => void;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ScrapedJobsList({ onApply }: ScrapedJobsListProps) {
  const queryClient = useQueryClient();
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['scraped-jobs', 7],
    queryFn: async () => {
      const response = await apiClient.get<ScrapedJob[]>('/jobs/scraped', {
        params: { limit: 20, days: 7 }
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
    onSuccess: (response, job) => {
      const data = response.data;
      if (data.created) {
        toast.success(data.message || 'Saved to your applications!');
      } else {
        toast.info(data.message || 'This job is already saved in your applications.');
      }
      setSavedIds((prev) => ({ ...prev, [String(job.id)]: true }));
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || 'Failed to add job');
    }
  });

  if (isLoading) {
    return (
      <Card className="border-sky-100 dark:border-sky-900/30 bg-white dark:bg-gray-950">
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card className="border-sky-100 dark:border-sky-900/30 bg-white dark:bg-gray-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Discoverable Jobs
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Run Job Scraper to fetch live openings and save them to your applications.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-sky-100 dark:border-sky-900/30 bg-white dark:bg-gray-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Scraped Jobs (Last 7 Days)
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
              className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:from-gray-950 dark:to-sky-950/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{job.title}</h3>
                  <p className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.company}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location || 'Location not specified'}
                  </p>
                </div>
                <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  {timeAgo(job.created_at)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(job.link, '_blank')}
                  title="View Original"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {!savedIds[String(job.id)] ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 border-sky-200 text-xs text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/30"
                    onClick={() => importMutation.mutate(job)}
                    disabled={importMutation.isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Save
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onApply?.()}
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../components/ui/Toast';
import { jobService } from '../../../services/job.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../../../lib/api';



export function JobScraper() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState('');
  const [formData, setFormData] = useState({
    keyword: '',
    location: '',
    limit: 10,
  });
  // Removed scrapedJobs state as the new service doesn't return immediate results to display

  const scrapeMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      jobService.scrapeJobs(data.keyword, data.location, data.limit),
    onSuccess: (data: any) => {
      // Ideally the backend returns the jobs, but if it returns a task ID or generic message, we might need to change this.
      // The mock above expected { jobs: [], count: 0 }
      // But jobService.scrapeJobs returns { message, jobs_found }
      // So we might need to adjust or invalidate queries to fetch new jobs.

      toast.success(`Scraping started! Found ${data.jobs_found} potential jobs.`);
      // Invalidate jobs to show new ones if they are added to DB
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.keyword) {
      toast.error('Please enter a job keyword');
      return;
    }

    setProgress('Initiating scraping agent...');

    // Simulate progress steps if we want purely UI feedback, otherwise better to rely on real status
    // For now, we just call the mutation
    scrapeMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-500" />
          <CardTitle>Job Scraper</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleScrape} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Keyword *
              </label>
              <input
                type="text"
                name="keyword"
                value={formData.keyword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limit
              </label>
              <input
                type="number"
                name="limit"
                value={formData.limit}
                onChange={handleInputChange}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={scrapeMutation.isPending}
              className="min-w-[200px]"
            >
              {scrapeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {progress || 'Scraping...'}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scrape Jobs
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Note: The new scraper service might run in background, so showing immediate results might require polling or a separate 'Recent Scrapes' query.
            For now, we simply confirm the start. */}
        {scrapeMutation.isSuccess && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 rounded-md">
            Scraping task initiated successfully. Check the jobs table or logs for updates.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

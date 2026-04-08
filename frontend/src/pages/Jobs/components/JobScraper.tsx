import { useEffect, useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { toast } from '../../../components/ui/Toast';
import { jobService } from '../../../services/job.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../../../lib/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { getStoredProfile } from '../../../utils/profile';
import { UI_HINT_KEYS, dismissUiHint, isUiHintDismissed } from '../../../utils/uiHints';



interface JobScraperProps {
  onScrapeTriggered?: () => void;
  onScrapeSuccess?: () => void;
}

function mapExperienceLevelToScraper(experienceLevel?: string): string {
  switch (experienceLevel) {
    case 'entry':
      return 'entry level';
    case 'mid':
      return 'mid level';
    case 'senior':
      return 'senior';
    case 'lead':
      return 'lead';
    case 'manager':
      return 'lead';
    default:
      return '';
  }
}

export function JobScraper({ onScrapeTriggered, onScrapeSuccess }: JobScraperProps) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState('');
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [lastScrapeStatus, setLastScrapeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [autoFilledFromProfile, setAutoFilledFromProfile] = useState(false);
  const [profileHintDismissed, setProfileHintDismissed] = useState(() => {
    return isUiHintDismissed(UI_HINT_KEYS.JOB_SCRAPER_PROFILE_AUTOFILL_DISMISSED);
  });
  const [formData, setFormData] = useState({
    keyword: '',
    location: '',
    limit: 10,
    experience: '',
    jobType: '',
  });

  useEffect(() => {
    const profile = getStoredProfile();
    if (!profile) return;

    setFormData((prev) => {
      const mappedExperience = mapExperienceLevelToScraper(profile.experience_level);

      const nextKeyword = prev.keyword || profile.current_title || '';
      const nextLocation = prev.location || profile.location || '';
      const nextExperience = prev.experience || mappedExperience || '';
      const nextJobType = prev.jobType || 'remote';

      const changedByProfile =
        nextKeyword !== prev.keyword ||
        nextLocation !== prev.location ||
        nextExperience !== prev.experience ||
        nextJobType !== prev.jobType;

      if (changedByProfile) {
        setAutoFilledFromProfile(true);
      }

      const next = {
        ...prev,
        keyword: nextKeyword,
        location: nextLocation,
        experience: nextExperience,
        jobType: nextJobType,
      };

      return next;
    });
  }, []);

  // Listen to live scraping updates via WebSocket
  useWebSocket({
    onActivity: (activity) => {
      if (activity.title !== 'Job Scraper') {
        return;
      }

      // Check if it's a scraping activity to update progress
      if (activity.type === 'scraping' || activity.type === 'error' || (activity.type === 'success' && activity.title.includes('Scrap'))) {
        setProgress(activity.description || activity.title);
        // If success or error, we might end the visual spinner
        if (activity.type === 'success' || activity.type === 'error') {
          setIsScrapingInProgress(false);
          if (activity.type === 'success') {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['scraped-jobs'] });

            const total = Number(activity.metadata?.total ?? 0);
            const newJobs = Number(activity.metadata?.new ?? 0);
            if (Number.isFinite(total) && total >= 0 && Number.isFinite(newJobs) && newJobs >= 0) {
              toast.success(`Scraping complete: ${total} total jobs found (${newJobs} new).`);
              setLastScrapeStatus({
                type: 'success',
                message: `Scraping complete: ${total} total jobs found (${newJobs} new).`,
              });
            }
            onScrapeSuccess?.();
          } else {
            const errorMessage = activity.description || 'Scraping failed. Please try again.';
            toast.error(errorMessage);
            setLastScrapeStatus({ type: 'error', message: errorMessage });
          }
        }
      } else if (activity.title.toLowerCase().includes('scrap')) {
        // Fallback matched by title
        setProgress(activity.description || activity.title);
      }
    }
  });

  const scrapeMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      jobService.scrapeJobs(
        data.keyword,
        data.location,
        data.limit,
        data.experience,
        data.jobType
      ),
    onSuccess: (data: { message: string; jobs_found?: number | null }) => {
      const jobsFound = typeof data.jobs_found === 'number' && data.jobs_found > 0 ? data.jobs_found : null;

      toast.success(
        jobsFound
          ? `Scraping started. Found ${jobsFound} potential jobs.`
          : 'Scraping started. Results will appear in Scraped Jobs when ready.'
      );
      // Invalidate jobs to show new ones if they are added to DB
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['scraped-jobs'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
    setIsScrapingInProgress(true);
    setLastScrapeStatus(null);
    onScrapeTriggered?.();

    // Simulate progress steps if we want purely UI feedback, otherwise better to rely on real status
    // For now, we just call the mutation
    scrapeMutation.mutate(formData);
  };

  const applyProfileDefaults = () => {
    const profile = getStoredProfile();

    if (!profile) {
      toast.info('No saved profile found. Please complete your profile first.');
      return;
    }

    const mappedExperience = mapExperienceLevelToScraper(profile.experience_level);

    setFormData((prev) => ({
      ...prev,
      keyword: profile.current_title || prev.keyword,
      location: profile.location || prev.location,
      experience: mappedExperience || prev.experience,
      jobType: prev.jobType || 'remote',
    }));

    toast.success('Applied profile defaults to job search.');
  };

  const dismissProfileHint = () => {
    setProfileHintDismissed(true);
    dismissUiHint(UI_HINT_KEYS.JOB_SCRAPER_PROFILE_AUTOFILL_DISMISSED);
  };

  return (
    <Card className="border-gray-200/80 shadow-sm dark:border-gray-800">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-sky-50/90 via-white to-cyan-50/70 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-white text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300">
              <Search className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-lg">Job Scraper</CardTitle>
              <CardDescription>Discover fresh roles faster with smart defaults and live progress.</CardDescription>
            </div>
          </div>
          {autoFilledFromProfile && !profileHintDismissed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300">
              Auto-filled from Profile
              <button
                type="button"
                aria-label="Dismiss profile autofill hint"
                onClick={dismissProfileHint}
                className="rounded-full p-0.5 text-emerald-700/80 transition hover:bg-emerald-200/60 hover:text-emerald-800 dark:text-emerald-300/80 dark:hover:bg-emerald-800/50 dark:hover:text-emerald-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleScrape} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                Job Keyword *
              </label>
              <input
                type="text"
                name="keyword"
                value={formData.keyword}
                onChange={handleInputChange}
                required
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Remote"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                Limit
              </label>
              <input
                type="number"
                name="limit"
                value={formData.limit}
                onChange={handleInputChange}
                min="1"
                max="50"
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                Experience
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">Any</option>
                <option value="entry level">Entry Level</option>
                <option value="junior">Junior</option>
                <option value="mid level">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                Job Type
              </label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleInputChange}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">Any</option>
                <option value="remote">Remote</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={applyProfileDefaults}
              disabled={scrapeMutation.isPending || isScrapingInProgress}
              className="rounded-xl"
            >
              Use Profile Defaults
            </Button>
            <Button
              type="submit"
              disabled={scrapeMutation.isPending || isScrapingInProgress}
              className="min-w-[200px] rounded-xl"
            >
              {(scrapeMutation.isPending || isScrapingInProgress) ? (
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

        {isScrapingInProgress && (
          <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-900/20 dark:text-cyan-300">
            {progress || 'Scraping in progress. Live updates will appear here.'}
          </div>
        )}

        {!isScrapingInProgress && lastScrapeStatus && (
          <div
            className={`mt-4 rounded-xl border p-4 ${
              lastScrapeStatus.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300'
            }`}
          >
            {lastScrapeStatus.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

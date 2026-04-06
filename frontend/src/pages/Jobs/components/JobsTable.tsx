import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { jobService, type Job, type JobFilters } from '../../../services/job.service';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../../components/ui/Table';
import { AnimatePresence } from 'framer-motion';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ExternalLink, Trash2, ChevronDown, Briefcase, CheckCircle2, Clock3, XCircle, Sparkles, Mail, Zap } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingTable } from '../../../components/ui/LoadingTable';
import { toast } from '../../../components/ui/Toast';
import { setColdMailContext } from '../../../utils/coldMailContext';
import apiClient, { apiClientLongTimeout } from '../../../lib/api';

const STATUS_OPTIONS: Job['status'][] = ['pending', 'applied', 'interviewing', 'offered', 'rejected', 'failed'];

const STATUS_VARIANT: Record<Job['status'], string> = {
  interviewing: 'warning',
  applied: 'secondary',
  rejected: 'danger',
  offered: 'success',
  pending: 'default',
  failed: 'danger',
};

const STATUS_META: Record<Job['status'], { label: string; icon: typeof Clock3; tone: string }> = {
  pending: {
    label: 'Pending',
    icon: Clock3,
    tone: 'from-slate-500/15 to-slate-100 dark:from-slate-600/25 dark:to-slate-800/10',
  },
  applied: {
    label: 'Applied',
    icon: Briefcase,
    tone: 'from-sky-500/15 to-sky-100 dark:from-sky-600/20 dark:to-sky-900/10',
  },
  interviewing: {
    label: 'Interviewing',
    icon: Sparkles,
    tone: 'from-amber-500/20 to-amber-100 dark:from-amber-500/25 dark:to-amber-900/10',
  },
  offered: {
    label: 'Offered',
    icon: CheckCircle2,
    tone: 'from-emerald-500/20 to-emerald-100 dark:from-emerald-500/25 dark:to-emerald-900/10',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    tone: 'from-rose-500/20 to-rose-100 dark:from-rose-500/25 dark:to-rose-900/10',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    tone: 'from-red-500/20 to-red-100 dark:from-red-500/25 dark:to-red-900/10',
  },
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString();
}

export function JobsTable({ filters, onStartScan }: { filters: JobFilters; onStartScan?: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
  const [cachedEmails, setCachedEmails] = useState<Record<string, { cached: boolean; email_count: number }>>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside any dropdown
      const clickedElement = event.target as Element;
      const isInsideDropdown = clickedElement.closest('[data-dropdown="true"]');

      if (!isInsideDropdown && openStatusMenu) {
        setOpenStatusMenu(null);
      }
    };

    if (openStatusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openStatusMenu]);

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobService.getJobs(filters),
  });

  // Check cache status for all visible companies
  useEffect(() => {
    if (!jobs || jobs.length === 0) return;

    const checkCacheStatus = async () => {
      const uniqueCompanies = Array.from(new Set(jobs.map(j => j.company)));
      const cacheStatus: Record<string, { cached: boolean; email_count: number }> = {};

      for (const company of uniqueCompanies) {
        try {
          const response = await apiClient.get(`/emails/check-cached/${encodeURIComponent(company)}`);
          cacheStatus[company] = {
            cached: response.data.cached,
            email_count: response.data.email_count || 0
          };
        } catch {
          // Silently fail - doesn't affect functionality
          cacheStatus[company] = { cached: false, email_count: 0 };
        }
      }

      setCachedEmails(cacheStatus);
    };

    checkCacheStatus();
  }, [jobs]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return jobService.deleteJob(id);
    },
    onSuccess: () => {
      toast.success('Job removed');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => {
      toast.error('Failed to remove job');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Job['status'] }) => {
      return jobService.updateJob(id, { status });
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const handleStatusClick = (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenStatusMenu(openStatusMenu === jobId ? null : jobId);
  };

  const handleStatusChange = (jobId: string, status: Job['status']) => {
    statusMutation.mutate({ id: jobId, status });
    setOpenStatusMenu(null);
  };

  const handleDelete = (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Remove this job from your list?')) {
      deleteMutation.mutate(jobId);
    }
  };

  const handleExternalLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    window.open(url, '_blank');
  };

  const handleUseForColdMail = async (job: Job, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const toastId = toast.loading('Finding HR email...');
    
    try {
      // Call backend to scrape HR emails (use long timeout for scraping operations)
      const response = await apiClientLongTimeout.post('/emails/scrape-hr', {
        company: job.company,
        domain: undefined, // Let backend guess from company name
      });
      
      const hrEmails = response.data.emails || [];
      const recipientEmail = hrEmails[0] || '';
      
      setColdMailContext({
        company_name: job.company,
        job_role: job.title,
        recipient_email: recipientEmail,
        source: 'jobs_table_with_scraper',
      });
      
      toast.dismiss(toastId);
      if (hrEmails.length > 0) {
        toast.success(`Found ${hrEmails.length} HR email${hrEmails.length !== 1 ? 's' : ''}! Prefilled.`);
      } else {
        toast.info('Could not find HR email - you can enter it manually.');
      }
      
      navigate('/email-campaigns');
    } catch (error) {
      toast.dismiss(toastId);
      toast.warning('Could not scrape HR email - you can enter it manually.');
      
      // Fallback: still go to cold mail with company/role only
      setColdMailContext({
        company_name: job.company,
        job_role: job.title,
        source: 'jobs_table_fallback',
      });
      
      navigate('/email-campaigns');
    }
  };

  const jobsData = jobs ?? [];
  const countsByStatus = STATUS_OPTIONS.reduce((acc, current) => {
    acc[current] = jobsData.filter((job) => job.status === current).length;
    return acc;
  }, {} as Record<Job['status'], number>);

  if (isLoading) {
    return <LoadingTable columnCount={5} headers={['Job Details', 'Status', 'Date Added', 'Platform', 'Actions']} />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading jobs. Please try again.
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={ExternalLink}
        title="No jobs found"
        description="You haven't added any jobs yet. Use the scraper above to find opportunities."
        action={{ label: 'Start Scan', onClick: () => onStartScan?.() }}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATUS_OPTIONS.map((statusOption) => {
          const meta = STATUS_META[statusOption];
          const Icon = meta.icon;
          const count = countsByStatus[statusOption];
          return (
            <article
              key={statusOption}
              className={`rounded-2xl border border-gray-200/80 bg-gradient-to-br ${meta.tone} px-4 py-3 shadow-sm dark:border-gray-800`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  {meta.label}
                </p>
                <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </div>
              <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{count}</p>
            </article>
          );
        })}
      </div>

      <div className="overflow-visible rounded-3xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <Table>
        <TableHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900">
          <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
            <TableHead className="w-[35%]">Job Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="overflow-visible">
          <AnimatePresence mode="popLayout">
            {jobs.map((job) => (
              <TableRow
                key={job.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="group relative hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10"
              >
                {/* Job Details */}
                <TableCell>
                  <div className="flex flex-col">
                    <span
                      className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      onClick={(e) => job.job_url && handleExternalLink(job.job_url, e)}
                    >
                      {job.title}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {job.company}{job.location ? ` • ${job.location}` : ''}
                    </span>
                  </div>
                </TableCell>

                {/* Status — click badge to change */}
                <TableCell className="relative overflow-visible">
                  <div className="relative inline-block" data-dropdown="true">
                    <button
                      type="button"
                      className="flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={(e) => handleStatusClick(job.id, e)}
                    >
                      <Badge variant={STATUS_VARIANT[job.status] as "default" | "warning" | "secondary" | "danger" | "success"} className="capitalize">
                        {job.status}
                      </Badge>
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </button>
                    {openStatusMenu === job.id && (
                      <div
                        data-dropdown="true"
                        className="absolute left-0 top-full z-[9999] mt-1 w-36 rounded-md border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm capitalize hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStatusChange(job.id, s);
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Date Added */}
                <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                  {formatDate(job.applied_at || job.created_at)}
                </TableCell>

                {/* Platform */}
                <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                  {job.source || 'Manual'}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-100 md:group-hover:opacity-100">
                    <div className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Use in cold HR mail"
                        onClick={(e) => handleUseForColdMail(job, e)}
                        className="h-8 w-8 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-900/20"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {cachedEmails[job.company]?.cached && (
                        <div
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-cyan-500 dark:bg-cyan-400 flex items-center justify-center"
                          title={`${cachedEmails[job.company].email_count} HR email(s) cached`}
                        >
                          <Zap className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    {job.job_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Open original listing"
                        onClick={(e) => handleExternalLink(job.job_url!, e)}
                        className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete job"
                      onClick={(e) => handleDelete(job.id, e)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>

      <div className="flex items-center px-4 py-3 border-t dark:border-gray-800 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-gray-900 rounded-b-3xl">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {jobsData.length} job{jobsData.length !== 1 ? 's' : ''}
        </span>
      </div>
      </div>
    </section>
  );
}

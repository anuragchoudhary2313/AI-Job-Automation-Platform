import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, type Job, type JobFilters } from '../../../services/job.service';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../../components/ui/Table';
import { AnimatePresence } from 'framer-motion';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ExternalLink, Trash2, ChevronDown } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingTable } from '../../../components/ui/LoadingTable';
import { toast } from '../../../components/ui/Toast';

const STATUS_OPTIONS: Job['status'][] = ['pending', 'applied', 'interviewing', 'offered', 'rejected', 'failed'];

const STATUS_VARIANT: Record<Job['status'], string> = {
  interviewing: 'warning',
  applied: 'secondary',
  rejected: 'danger',
  offered: 'success',
  pending: 'default',
  failed: 'danger',
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString();
}

export function JobsTable({ filters, onStartScan }: { filters: JobFilters; onStartScan?: () => void }) {
  const queryClient = useQueryClient();
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('Delete mutation function called with id:', id);
      return jobService.deleteJob(id);
    },
    onSuccess: () => {
      console.log('Delete mutation succeeded');
      toast.success('Job removed');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      console.log('Delete mutation failed:', error);
      toast.error('Failed to remove job');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Job['status'] }) => {
      console.log('Status mutation function called with id:', id, 'status:', status);
      return jobService.updateJob(id, { status });
    },
    onSuccess: () => {
      console.log('Status mutation succeeded');
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      console.log('Status mutation failed:', error);
      toast.error('Failed to update status');
    },
  });

  const handleStatusClick = (jobId: string, event: React.MouseEvent) => {
    console.log('Status click handler called for job:', jobId);
    event.stopPropagation();
    setOpenStatusMenu(openStatusMenu === jobId ? null : jobId);
    console.log('Open status menu set to:', openStatusMenu === jobId ? null : jobId);
  };

  const handleStatusChange = (jobId: string, status: Job['status']) => {
    console.log('Status change handler called for job:', jobId, 'new status:', status);
    statusMutation.mutate({ id: jobId, status });
    setOpenStatusMenu(null);
  };

  const handleDelete = (jobId: string, event: React.MouseEvent) => {
    console.log('Delete handler called for job:', jobId);
    event.stopPropagation();
    if (confirm('Remove this job from your list?')) {
      console.log('User confirmed delete, calling mutation');
      deleteMutation.mutate(jobId);
    } else {
      console.log('User cancelled delete');
    }
  };

  const handleExternalLink = (url: string, event: React.MouseEvent) => {
    console.log('External link handler called with URL:', url);
    event.stopPropagation();
    window.open(url, '_blank');
  };

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
    <div className="overflow-visible">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
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
                className="group relative hover:bg-gray-50 dark:hover:bg-gray-900/50"
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
                      <Badge variant={STATUS_VARIANT[job.status] as any} className="capitalize">
                        {job.status}
                      </Badge>
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </button>
                    {openStatusMenu === job.id && (
                      <div
                        data-dropdown="true"
                        className="absolute left-0 top-full z-[999] mt-1 w-36 rounded-md border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                        style={{
                          position: 'absolute',
                          zIndex: 9999
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm capitalize hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                            onMouseDown={(e) => {
                              console.log('Mouse down on option:', s);
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              console.log('Dropdown option clicked:', s, 'for job:', job.id);
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
                    {job.job_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Open original listing"
                        onClick={(e) => {
                          console.log('External link button clicked for job:', job.id);
                          handleExternalLink(job.job_url!, e);
                        }}
                        className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete job"
                      onClick={(e) => {
                        console.log('Delete button clicked for job:', job.id);
                        handleDelete(job.id, e);
                      }}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:opacity-50"
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

      <div className="flex items-center px-4 py-3 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

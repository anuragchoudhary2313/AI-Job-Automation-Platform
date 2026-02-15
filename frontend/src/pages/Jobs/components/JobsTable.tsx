import { useQuery } from '@tanstack/react-query';
import { jobService, type Job, type JobFilters } from '../../../services/job.service';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../../components/ui/Table';
import { AnimatePresence } from 'framer-motion';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ExternalLink, RefreshCw, Mail, MoreHorizontal } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingTable } from '../../../components/ui/LoadingTable';

const getStatusVariant = (status: Job['status']) => {
  switch (status) {
    case 'interviewing': return 'warning';
    case 'applied': return 'secondary';
    case 'rejected': return 'danger';
    case 'offer': return 'success';
    default: return 'default';
  }
};

export function JobsTable({ filters }: { filters: JobFilters }) {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobService.getJobs(filters)
  });

  if (isLoading) {
    return <LoadingTable columnCount={5} headers={['Job Details', 'Status', 'Date Applied', 'Platform', 'Actions']} />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading jobs. Please try again later.
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={ExternalLink}
        title="No jobs found"
        description="You haven't applied to any jobs yet. Start your first scan to find opportunities."
        action={{ label: "Start Scan", onClick: () => console.log("Scan started") }}
      />
    );
  }

  return (
    <div className="rounded-md border dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
          <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
            <TableHead className="w-[30%]">Job Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Applied</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {jobs.map((job) => (
              <TableRow
                key={job.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.005, backgroundColor: "rgba(0,0,0,0.01)" }}
                className="group relative cursor-pointer"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                      {job.title}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {job.company} • {job.location}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(job.status)} className="capitalize">
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {job.applied_at ? new Date(job.applied_at).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {job.source}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" title="Open Link" onClick={() => window.open(job.url, '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Re-apply">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Send Email">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {jobs.length} jobs
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}

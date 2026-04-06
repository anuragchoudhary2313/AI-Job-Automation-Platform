import { FileText, Download, Trash2, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { Resume } from '../../../types/models';
import { formatDistanceToNow } from 'date-fns';

const getResumeId = (resume: Resume & { _id?: string }) => resume.id || resume._id || '';

interface ResumeCardProps {
  resume: Resume;
  onDelete?: (id: string) => void;
  onDownload?: (id: string, fileName: string) => void;
}

export function ResumeCardSkeleton() {
  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <CardContent className="space-y-3 p-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function ResumeCard({ resume, onDelete, onDownload }: ResumeCardProps) {
  const fileName = resume.filename || resume.title || 'Untitled Resume';
  const displayDate = resume.created_at
    ? formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })
    : 'Unknown date';

  return (
    <Card hoverable className="group overflow-hidden border-gray-200 bg-white/95 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50/60 p-4 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100" title={fileName}>
            {fileName}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {displayDate}
          </p>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          Keep this version ready for role-specific applications and quick sharing with recruiters.
        </p>

        <div className="flex items-center gap-2">
          {onDownload && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 flex-1 rounded-lg border-gray-200 text-xs dark:border-gray-700"
              title="Download"
              onClick={() => onDownload(getResumeId(resume), fileName)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 rounded-lg px-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              title="Delete"
              onClick={() => onDelete(getResumeId(resume))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

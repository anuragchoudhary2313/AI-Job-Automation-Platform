import { FileText, Download, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { Resume } from '../../../types/models';
import { formatDistanceToNow } from 'date-fns';

interface ResumeCardProps {
  resume: Resume;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export function ResumeCardSkeleton() {
  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
      <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-8 flex items-center justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      <CardContent className="p-3 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
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
    <Card hoverable className="group relative overflow-hidden border-gray-200 dark:border-gray-800">
      {/* Preview Area */}
      <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-gray-900 relative flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-gray-800">
        <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700" />

        {/* Hover Overlay with Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
          {onDownload && (
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download"
              onClick={() => onDownload(resume.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
              title="Delete"
              onClick={() => onDelete(resume.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Info Content */}
      <CardContent className="p-3">
        <div className="w-full overflow-hidden">
          <p className="truncate font-medium text-sm text-gray-900 dark:text-gray-100" title={fileName}>
            {fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {displayDate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

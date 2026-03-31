import { useState, useCallback } from 'react';
import { Upload, FileUp, ShieldCheck } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';

interface UploadAreaProps {
  onUpload?: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function UploadArea({ onUpload, disabled = false }: UploadAreaProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    if (!onUpload) return;

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress while upload happens
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Call the actual upload function passed from parent
      await onUpload(file);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      setUploading(false);
      setProgress(0);
      throw error;
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleUpload(files[0]);
    }
  }, [handleUpload]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 min-h-[220px]",
        dragging ? "border-blue-500 bg-blue-50/80 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600",
        uploading && "pointer-events-none opacity-80"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(14,165,233,0.12),transparent_30%)]" />
      {uploading ? (
        <div className="w-full max-w-xs space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 animate-pulse dark:bg-blue-900 dark:text-blue-300">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">Uploading resume...</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please wait while we process your file.</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line */}
            <style>{`[data-progress="${progress}"] { width: ${progress}%; }`}</style>
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 ease-out" data-progress={progress} />
          </div>
        </div>
      ) : (
        <div className="relative space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400">
            <FileUp className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">Drag and drop your resume here</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">PDF or DOCX, up to 10MB</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg border-gray-300 bg-white/80 px-4 dark:border-gray-700 dark:bg-gray-900"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={disabled}
          >
            Select File
          </Button>
          <p className="flex items-center justify-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Files are stored securely and can be deleted anytime.
          </p>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            aria-label="Upload resume file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
        </div>
      )}
    </div>
  );
}

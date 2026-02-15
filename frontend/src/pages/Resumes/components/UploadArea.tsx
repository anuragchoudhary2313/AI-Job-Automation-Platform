import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleUpload(files[0]);
    }
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      // Call real API via useResumes hook (will be passed as prop)
      // For now, simulate progress while upload happens
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // This will be replaced with actual uploadResume call from parent
      // await uploadResume(file);

      // Simulate upload for now - will be wired in parent component
      await new Promise(resolve => setTimeout(resolve, 2000));

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
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-200 p-8 flex flex-col items-center justify-center text-center",
        dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700",
        uploading && "pointer-events-none opacity-80"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ minHeight: '200px' }}
    >
      {uploading ? (
        <div className="w-full max-w-xs space-y-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mx-auto animate-pulse">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Uploading Resume...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait while we process your file.</p>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PDF, DOCX up to 10MB</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
            Select File
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.docx"
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

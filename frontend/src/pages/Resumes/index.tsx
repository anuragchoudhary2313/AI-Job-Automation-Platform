import { useState } from 'react';
import { ResumeCard, ResumeCardSkeleton } from './components/ResumeCard';
import { UploadArea } from './components/UploadArea';
import { ResumeGenerator } from './components/ResumeGenerator';
import { Upload, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useResumes } from '../../hooks/useResumes';


export default function Resumes() {
  const { resumes, loading, uploadResume, deleteResume, downloadResume } = useResumes();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadResume(file);
    } catch (error) {
      // Error is handled by hook toast
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await deleteResume(id);
    } catch (error) {
      // Error is handled by hook
    }
  };

  const handleDownload = async (id: string) => {
    await downloadResume(id);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Resume Manager</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Upload and manage your CV versions.</p>
        </div>
        <Button onClick={() => document.getElementById('file-upload')?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload New
        </Button>
      </div>

      {/* AI Resume Generator */}
      <ResumeGenerator />

      <UploadArea onUpload={handleUpload} disabled={uploading} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Files</h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <ResumeCardSkeleton key={i} />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resumes uploaded"
            description="Upload your first resume to start matching with jobs."
            action={{ label: "Upload Resume", onClick: () => document.getElementById('file-upload')?.click() }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {resumes.map((resume, index) => (
              <ResumeCard
                key={resume.id || `resume-${index}`}
                resume={resume}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            ))}
            {/* Create New Card */}
            <div className="group relative border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl flex flex-col items-center justify-center p-6 transition-colors cursor-pointer min-h-[280px]" onClick={() => document.getElementById('file-upload')?.click()}>
              <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <span className="text-xl text-gray-400 group-hover:text-blue-500 transition-colors">+</span>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">Create New</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

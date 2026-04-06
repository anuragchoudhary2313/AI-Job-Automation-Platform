import { useState } from 'react';
import { motion } from 'framer-motion';
import { ResumeCard, ResumeCardSkeleton } from './components/ResumeCard';
import { UploadArea } from './components/UploadArea';
import { ResumeGenerator } from './components/ResumeGenerator';
import { Upload, FileText, Sparkles, Clock3, FolderOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useResumes } from '../../hooks/useResumes';
import { useFeatures } from '../../contexts/FeatureContext';

const getResumeKey = (resume: { id?: string; _id?: string }, index: number) => resume.id || resume._id || `resume-${index}`;

export default function Resumes() {
  const { isEnabled } = useFeatures();
  const { resumes, loading, uploadResume, deleteResume, downloadResume } = useResumes();
  const [uploading, setUploading] = useState(false);

  const resumeCount = resumes.length;
  const latestResume = resumes
    .map((item) => item.created_at)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const latestLabel = latestResume
    ? new Date(latestResume).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No uploads yet';

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

  const handleDownload = async (id: string, fileName: string) => {
    await downloadResume(id, fileName);
  };

  const triggerUpload = () => {
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.click();
  };

  const handleCreateNew = () => {
    if (isEnabled('ai_resume')) {
      document.getElementById('ai-resume-generator')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      triggerUpload();
    }
  };

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="overflow-hidden rounded-3xl border border-[#171717]/10 bg-[linear-gradient(130deg,#f6fbff_0%,#f9f7ff_50%,#fff7ef_100%)] p-6 shadow-sm dark:border-gray-800 dark:bg-[linear-gradient(130deg,#111827_0%,#1f2937_60%,#1f2937_100%)] md:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#171717]/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#171717]/65 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              Resume Studio
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#171717] dark:text-white md:text-4xl">
              Build and manage interview-ready resumes
            </h1>
            <p className="max-w-2xl text-sm text-[#171717]/68 dark:text-gray-300">
              Keep multiple tailored versions, upload source files fast, and generate AI-optimized
              resumes from job descriptions in one workspace.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={triggerUpload} className="h-10 rounded-xl bg-[#171717] px-4 text-white hover:bg-black">
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume
              </Button>
              {isEnabled('ai_resume') && (
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-[#171717]/20 bg-white/70 px-4 text-[#171717] hover:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  onClick={() => document.getElementById('ai-resume-generator')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Open AI Generator
                </Button>
              )}
            </div>
          </div>

          <div className="grid min-w-[260px] gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-[#171717]/10 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-900/80">
              <p className="text-xs uppercase tracking-[0.1em] text-[#171717]/50 dark:text-gray-400">Total Resumes</p>
              <p className="mt-1 text-2xl font-bold text-[#171717] dark:text-white">{resumeCount}</p>
            </div>
            <div className="rounded-2xl border border-[#171717]/10 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-900/80">
              <p className="text-xs uppercase tracking-[0.1em] text-[#171717]/50 dark:text-gray-400">Latest Upload</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#171717] dark:text-white">
                <Clock3 className="h-4 w-4" />
                {latestLabel}
              </p>
            </div>
            <div className="rounded-2xl border border-[#171717]/10 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-900/80">
              <p className="text-xs uppercase tracking-[0.1em] text-[#171717]/50 dark:text-gray-400">Library State</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#171717] dark:text-white">
                <FolderOpen className="h-4 w-4" />
                {resumeCount > 0 ? 'Active' : 'Empty'}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 md:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Upload Zone
            </h2>
            <UploadArea onUpload={handleUpload} disabled={uploading} />
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resume Library</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                {resumeCount} item{resumeCount === 1 ? '' : 's'}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ResumeCardSkeleton key={i} />
                ))}
              </div>
            ) : resumes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No resumes uploaded"
                description="Upload your first resume to start matching with jobs."
                action={{ label: "Upload Resume", onClick: triggerUpload }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {resumes.map((resume, index) => (
                  <ResumeCard
                    key={getResumeKey(resume, index)}
                    resume={resume}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                  />
                ))}

                <div
                  className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-blue-500 hover:bg-blue-50/50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
                  onClick={handleCreateNew}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition group-hover:text-blue-500 dark:bg-gray-800 dark:text-gray-300">
                    <span className="text-2xl leading-none">+</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-700 transition group-hover:text-blue-600 dark:text-gray-200 dark:group-hover:text-blue-300">
                    Create New Resume
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {isEnabled('ai_resume') ? 'Open AI generator or upload a file' : 'Upload a new file'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {isEnabled('ai_resume') && (
          <div id="ai-resume-generator" className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 md:p-5">
            <ResumeGenerator />
          </div>
        )}
      </section>
    </div>
  );
}

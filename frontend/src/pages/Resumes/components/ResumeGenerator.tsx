import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Wand2, Loader2, Copy, Check, FileText, Download, RefreshCw, Sparkles, Maximize2, Minimize2, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../components/ui/Toast';
import apiClient, { getErrorMessage } from '../../../lib/api';
import { buildProfileResumeContext, getStoredProfile } from '../../../utils/profile';

const RESUME_GENERATOR_DRAFT_KEY = 'resume-generator-draft-v1';

type AtsAssessment = {
  ats_score: number;
  keyword_match_pct: number;
  keywords_total: number;
  keywords_matched: number;
  matched_keywords: string[];
  word_count: number;
  bullet_count: number;
  section_checks: Record<string, boolean>;
  recommendations: string[];
  passes_auto_gate: boolean;
};

export function ResumeGenerator() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [scoringAts, setScoringAts] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [jdFilename, setJdFilename] = useState('');
  const [extractingJD, setExtractingJD] = useState(false);
  const [currentResumeText, setCurrentResumeText] = useState('');
  const [currentResumeFilename, setCurrentResumeFilename] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [latexCode, setLatexCode] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isWorkspaceFullscreen, setIsWorkspaceFullscreen] = useState(false);
  const [isPdfPaneCollapsed, setIsPdfPaneCollapsed] = useState(false);
  const [editorPaneWidthPct, setEditorPaneWidthPct] = useState(56);
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [atsAssessment, setAtsAssessment] = useState<AtsAssessment | null>(null);
  const [allowSaveOverride, setAllowSaveOverride] = useState(false);

  const canGenerate = !!jobDescription.trim() && !generating;
  const extractedWords = useMemo(() => {
    if (!currentResumeText) return 0;
    return currentResumeText.trim().split(/\s+/).length;
  }, [currentResumeText]);
  const latexWords = useMemo(() => {
    if (!latexCode.trim()) return 0;
    return latexCode.trim().split(/\s+/).length;
  }, [latexCode]);

  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(RESUME_GENERATOR_DRAFT_KEY);
      if (!rawDraft) {
        const profileContext = buildProfileResumeContext(getStoredProfile());
        if (profileContext) {
          setCurrentResumeText(profileContext);
          setCurrentResumeFilename('Profile Context');
          toast.info('Loaded profile details as resume context.');
        }
        return;
      }

      const parsed = JSON.parse(rawDraft) as {
        jobDescription?: string;
        currentResumeText?: string;
        currentResumeFilename?: string;
      };

      if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
      if (parsed.currentResumeText) setCurrentResumeText(parsed.currentResumeText);
      if (parsed.currentResumeFilename) setCurrentResumeFilename(parsed.currentResumeFilename);

      if (parsed.jobDescription || parsed.currentResumeText) {
        toast.success('Restored your previous resume draft.');
      } else {
        const profileContext = buildProfileResumeContext(getStoredProfile());
        if (profileContext) {
          setCurrentResumeText(profileContext);
          setCurrentResumeFilename('Profile Context');
          toast.info('Loaded profile details as resume context.');
        }
      }
    } catch (error) {
      console.error('Failed to restore resume generator draft', error);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const draft = {
          jobDescription,
          currentResumeText,
          currentResumeFilename,
        };
        localStorage.setItem(RESUME_GENERATOR_DRAFT_KEY, JSON.stringify(draft));
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (error) {
        console.error('Failed to save resume generator draft', error);
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [jobDescription, currentResumeText, currentResumeFilename]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!isWorkspaceFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isWorkspaceFullscreen]);

  useEffect(() => {
    if (!isWorkspaceFullscreen || !isResizingSplit || isPdfPaneCollapsed) return;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (event: MouseEvent) => {
      const calculated = (event.clientX / window.innerWidth) * 100;
      const clamped = Math.min(75, Math.max(35, calculated));
      setEditorPaneWidthPct(clamped);
    };

    const stopResize = () => {
      setIsResizingSplit(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isWorkspaceFullscreen, isResizingSplit, isPdfPaneCollapsed]);

  const runAtsAssessment = useCallback(async (latex: string) => {
    if (!jobDescription.trim() || !latex.trim()) return;

    setScoringAts(true);
    try {
      const response = await apiClient.post<AtsAssessment>('/ai/resume/ats-score', {
        job_description: jobDescription,
        latex_code: latex,
      });
      setAtsAssessment(response.data);
    } catch (error: unknown) {
      console.error('ATS scoring error:', error);
      toast.error('ATS scoring failed. You can still edit and compile the resume.');
    } finally {
      setScoringAts(false);
    }
  }, [jobDescription]);

  const compilePdf = useCallback(async (code: string) => {
    setCompiling(true);
    try {
      const response = await apiClient.post('/resumes/compile-latex',
        { latex: code },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success('PDF compiled successfully!');
    } catch (error: unknown) {
      console.error('Compilation Error:', error);
      let message = 'Failed to compile LaTeX to PDF. Check syntax.';

      const maybeError = error as {
        response?: { data?: Blob | { detail?: string } | string };
      };

      if (maybeError?.response?.data instanceof Blob) {
        try {
          const text = await maybeError.response.data.text();
          const parsed = JSON.parse(text) as { detail?: string };
          if (parsed?.detail) {
            message = parsed.detail;
          }
        } catch {
          // Keep fallback message for non-JSON blob payloads.
        }
      } else if (typeof maybeError?.response?.data === 'object' && maybeError?.response?.data && 'detail' in maybeError.response.data) {
        const detail = (maybeError.response.data as { detail?: string }).detail;
        if (detail) message = detail;
      }

      toast.error(message);
    } finally {
      setCompiling(false);
    }
  }, [pdfUrl]);

  const generateResume = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setGenerating(true);
    setAtsAssessment(null);
    setAllowSaveOverride(false);
    setLatexCode('');
    setPdfUrl('');

    try {
      const response = await apiClient.post<string>('/ai/resume/generate-latex', {
        job_description: jobDescription,
        resume_text: currentResumeText || undefined,
      });
      const generatedLatex = response.data;
      setLatexCode(generatedLatex);
      setIsPdfPaneCollapsed(false);
      setIsWorkspaceFullscreen(true);
      toast.success('LaTeX code generated successfully! Compiling PDF...');

      await runAtsAssessment(generatedLatex);
      
      // Auto compile
      await compilePdf(generatedLatex);

    } catch (error: unknown) {
      console.error('AI Generation Error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  }, [compilePdf, currentResumeText, jobDescription, runAtsAssessment]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateResume();
  };

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWorkspaceFullscreen) {
        e.preventDefault();
        setIsWorkspaceFullscreen(false);
        return;
      }

      const hasModifier = e.ctrlKey || e.metaKey;
      if (!hasModifier) return;

      if (e.key === 'Enter' && canGenerate) {
        e.preventDefault();
        void generateResume();
        return;
      }

      if (e.key.toLowerCase() === 's' && latexCode && !compiling) {
        e.preventDefault();
        void compilePdf(latexCode);
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [canGenerate, compilePdf, generateResume, latexCode, compiling, isWorkspaceFullscreen]);

  const handleJDFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingJD(true);
    setJdFilename(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<string>('/resumes/extract-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const extractedText = response.data?.trim() || '';
      if (!extractedText) {
        toast.warning('No text could be extracted from the uploaded JD file.');
        return;
      }

      setJobDescription(extractedText);
      toast.success('Job description extracted and filled from file.');
    } catch (error: unknown) {
      console.error('JD extraction error:', error);
      toast.error(getErrorMessage(error));
      setJdFilename('');
    } finally {
      setExtractingJD(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleCopy = () => {
    if (!latexCode) return;
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    toast.success('Copied LaTeX to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveToLibrary = async () => {
    if (!latexCode.trim()) {
      toast.error('Generate a resume first before saving.');
      return;
    }

    if (atsAssessment && !atsAssessment.passes_auto_gate && !allowSaveOverride) {
      toast.error('ATS quality gate failed. Run ATS Check and use Save Anyway if you still want to save.');
      return;
    }

    setSavingToLibrary(true);
    try {
      const titleSeed = jobDescription.trim().split('\n')[0]?.slice(0, 120) || 'Generated Resume';
      const payload = {
        type: 'latex_resume',
        title: titleSeed,
        latex_code: latexCode,
        job_description: jobDescription,
        ats_assessment: atsAssessment,
        ats_gate_override: !!(atsAssessment && !atsAssessment.passes_auto_gate && allowSaveOverride),
        source_resume_filename: currentResumeFilename || null,
        saved_from: 'resume_generator',
        saved_at: new Date().toISOString(),
      };

      await apiClient.post('/resumes/save-generated', payload);
      await queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume saved to Resume Library.');
    } catch (error: unknown) {
      console.error('Save generated resume error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setSavingToLibrary(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setExtracting(true);
    setCurrentResumeFilename(file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<string>('/resumes/extract-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setCurrentResumeText(response.data);
      toast.success('Resume details extracted successfully!');
    } catch (error: unknown) {
      console.error('File extraction error:', error);
      toast.error(getErrorMessage(error) || 'Failed to extract text from file.');
      setCurrentResumeFilename('');
      setCurrentResumeText('');
    } finally {
      setExtracting(false);
      if (e.target) {
        e.target.value = ''; // Reset input
      }
    }
  };

  const handleClearResume = () => {
    setCurrentResumeText('');
    setCurrentResumeFilename('');
  };

  const workspacePanels = (fullscreen: boolean) => {
    const editorPane = (
      <div className={`flex flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950 md:p-4 ${fullscreen ? 'h-full min-h-0' : 'min-h-[520px] xl:h-[760px]'}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <FileText className="h-4 w-4 text-blue-500" />
            LaTeX Source
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {latexWords} words {lastSavedAt ? `| Draft saved ${lastSavedAt}` : ''}
          </p>
          {scoringAts && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-300">
              Scoring ATS...
            </span>
          )}
          {!scoringAts && atsAssessment && (
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                atsAssessment.ats_score >= 90
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : atsAssessment.ats_score >= 78
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              ATS {atsAssessment.ats_score}
            </span>
          )}
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="ghost" size="sm" className="h-9 flex-1 rounded-lg px-3 sm:h-8 sm:flex-none" onClick={handleCopy}>
              {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 rounded-lg px-3 sm:h-8 sm:flex-none"
                onClick={handleSaveToLibrary}
                disabled={
                  savingToLibrary
                  || !latexCode.trim()
                  || (!!atsAssessment && !atsAssessment.passes_auto_gate && !allowSaveOverride)
                }
              >
                {savingToLibrary ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
                {savingToLibrary ? 'Saving...' : 'Save'}
              </Button>
              {!!atsAssessment && !atsAssessment.passes_auto_gate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 rounded-lg border-amber-300 bg-amber-50 px-3 text-amber-800 hover:bg-amber-100 sm:h-8 sm:flex-none dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                  onClick={() => setAllowSaveOverride(true)}
                  disabled={allowSaveOverride}
                >
                  {allowSaveOverride ? 'Save Override Enabled' : 'Save Anyway'}
                </Button>
              )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-1 rounded-lg px-3 sm:h-8 sm:flex-none"
              onClick={() => runAtsAssessment(latexCode)}
              disabled={scoringAts || !latexCode.trim()}
            >
              {scoringAts ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
              ATS Check
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-1 rounded-lg px-3 sm:h-8 sm:flex-none"
              onClick={() => compilePdf(latexCode)}
              disabled={compiling}
            >
              {compiling ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
              Update PDF
            </Button>
          </div>
        </div>
        <textarea
          value={latexCode}
          onChange={(e) => setLatexCode(e.target.value)}
          title="LaTeX Source Editor"
          placeholder="LaTeX code"
          aria-label="LaTeX Source Editor"
          className={`w-full resize-none overflow-y-auto rounded-xl border border-gray-300 bg-gray-50 p-3 font-mono text-xs text-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 md:p-4 ${fullscreen ? 'min-h-0 flex-1' : 'min-h-[420px] flex-1'}`}
          spellCheck={false}
        />
        {atsAssessment && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-900/60">
            <p className="font-semibold text-gray-700 dark:text-gray-200">
              ATS summary: score {atsAssessment.ats_score} | keyword match {atsAssessment.keyword_match_pct}% | bullets {atsAssessment.bullet_count} | words {atsAssessment.word_count}
            </p>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Automation gate: {atsAssessment.passes_auto_gate ? 'Pass' : 'Needs improvement'}
            </p>
            {!atsAssessment.passes_auto_gate && (
              <p className="mt-1 font-medium text-amber-700 dark:text-amber-300">
                Save is gated until quality passes. Use Save Anyway only when you intentionally accept lower ATS quality.
              </p>
            )}
            {atsAssessment.recommendations?.length > 0 && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Top fix: {atsAssessment.recommendations[0]}
              </p>
            )}
          </div>
        )}
      </div>
    );

    const previewPane = (
      <div className={`flex flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950 md:p-4 ${fullscreen ? 'h-full min-h-0' : 'min-h-[520px] xl:h-[760px]'}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Live PDF Preview</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full rounded-lg px-3 sm:h-8 sm:w-auto"
            onClick={handleDownloadPdf}
            disabled={!pdfUrl}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Download PDF
          </Button>
        </div>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
          {compiling ? (
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <Loader2 className="mb-2 h-8 w-8 animate-spin" />
              <p className="text-sm">Compiling LaTeX preview...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={`${pdfUrl}#zoom=page-width&view=FitH`}
              className="h-full w-full border-none"
              title="Live Preview of Generated Resume PDF"
            />
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">PDF preview will appear here</p>
          )}
        </div>
      </div>
    );

    if (!fullscreen) {
      return <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.05fr_0.95fr]">{editorPane}{previewPane}</div>;
    }

    if (isPdfPaneCollapsed) {
      return <div className="h-full min-h-0">{editorPane}</div>;
    }

    return (
      <div
        className="grid h-full min-h-0 gap-0"
        style={{ gridTemplateColumns: `minmax(340px, ${editorPaneWidthPct}fr) 10px minmax(320px, ${100 - editorPaneWidthPct}fr)` }}
      >
        <div className="min-h-0 pr-2">{editorPane}</div>
        <button
          type="button"
          onMouseDown={() => setIsResizingSplit(true)}
          className="h-full cursor-col-resize rounded-lg bg-gray-200 transition hover:bg-violet-300 dark:bg-gray-800 dark:hover:bg-violet-800"
          aria-label="Resize editor and preview panes"
          title="Drag to resize panes"
        />
        <div className="min-h-0 pl-2">{previewPane}</div>
      </div>
    );
  };

  const fullscreenWorkspace =
    latexCode && isWorkspaceFullscreen
      ? createPortal(
          <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950">
            <div className="flex h-full flex-col p-3 md:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Overleaf-style Workspace</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Edit LaTeX and preview PDF side-by-side in full screen.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg px-3"
                    onClick={() => setIsPdfPaneCollapsed((prev) => !prev)}
                  >
                    {isPdfPaneCollapsed ? 'Show Preview' : 'Hide Preview'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg px-3"
                    onClick={() => setIsWorkspaceFullscreen(false)}
                  >
                    <Minimize2 className="mr-1.5 h-3.5 w-3.5" />
                    Exit Full Workspace
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1">{workspacePanels(true)}</div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <Card className="mx-auto w-full max-w-[1400px] border-gray-200/80 shadow-sm dark:border-gray-800">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-violet-50 via-blue-50 to-cyan-50 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-600 dark:border-violet-800 dark:bg-gray-900 dark:text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI Resume Studio
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Generate and edit ATS-ready LaTeX resumes
            </CardTitle>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Paste a job description, optionally attach your current resume, then generate and preview instantly.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-4 md:p-6">
        <form onSubmit={handleGenerate} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Job Description *
                </label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={handleJDFileUpload}
                    disabled={extractingJD}
                  />
                  <span
                    className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
                      extractingJD
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-500'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-violet-700 dark:hover:bg-violet-900/20'
                    }`}
                  >
                    {extractingJD ? 'Extracting JD...' : 'Upload JD (PDF / DOCX)'}
                  </span>
                </label>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
                rows={7}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Paste the target role description here..."
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {jdFilename
                  ? `Loaded JD file: ${jdFilename}`
                  : 'You can paste text or upload a JD file (PDF / DOCX).'}
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Optional Context Resume
              </p>

              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={extracting}
                />
                <div
                  role="button"
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    extracting
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-500'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-violet-700 dark:hover:bg-violet-900/20'
                  }`}
                >
                  {extracting ? 'Extracting details...' : 'Upload PDF / DOCX'}
                </div>
              </label>

              {currentResumeFilename ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <div className="mb-1 flex items-center gap-1 font-semibold">
                    <Check className="h-3.5 w-3.5" />
                    Extracted Resume Context
                  </div>
                  <p className="truncate" title={currentResumeFilename}>{currentResumeFilename}</p>
                  <p className="mt-1 text-[11px] opacity-80">{extractedWords} words extracted</p>
                  <button
                    type="button"
                    onClick={handleClearResume}
                    className="mt-2 text-[11px] font-semibold text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove context
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Attaching an existing resume improves extraction quality and keeps your experience details grounded.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-generated output: please review before sharing.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Shortcuts: Ctrl/Cmd+Enter to generate, Ctrl/Cmd+S to recompile preview.</p>
            </div>
            <Button type="submit" disabled={!canGenerate} className="h-10 min-w-[200px] rounded-xl bg-[#171717] text-white hover:bg-black">
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Resume...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate LaTeX Resume
                </>
              )}
            </Button>
          </div>
        </form>

        {latexCode && !isWorkspaceFullscreen && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg px-3"
                onClick={() => {
                  setIsPdfPaneCollapsed(false);
                  setIsWorkspaceFullscreen(true);
                }}
              >
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                Open Full Workspace
              </Button>
            </div>
            {workspacePanels(false)}
          </div>
        )}
      </CardContent>

      {fullscreenWorkspace}
    </Card>
  );
}

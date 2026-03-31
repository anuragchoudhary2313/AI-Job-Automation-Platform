import { useEffect, useMemo, useState } from 'react';
import { Wand2, Loader2, Copy, Check, FileText, Download, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../components/ui/Toast';
import apiClient, { getErrorMessage } from '../../../lib/api';

const RESUME_GENERATOR_DRAFT_KEY = 'resume-generator-draft-v1';

export function ResumeGenerator() {
  const [generating, setGenerating] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [currentResumeText, setCurrentResumeText] = useState('');
  const [currentResumeFilename, setCurrentResumeFilename] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [latexCode, setLatexCode] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');

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
      if (!rawDraft) return;

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
    const handleShortcuts = (e: KeyboardEvent) => {
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
  }, [canGenerate, latexCode, compiling]);

  const generateResume = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setGenerating(true);
    setLatexCode('');
    setPdfUrl('');

    try {
      const response = await apiClient.post<string>('/ai/resume/generate-latex', {
        job_description: jobDescription,
        resume_text: currentResumeText || undefined,
      });
      const generatedLatex = response.data;
      setLatexCode(generatedLatex);
      toast.success('LaTeX code generated successfully! Compiling PDF...');
      
      // Auto compile
      await compilePdf(generatedLatex);

    } catch (error: unknown) {
      console.error('AI Generation Error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateResume();
  };

  const compilePdf = async (code: string) => {
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
      toast.error('Failed to compile LaTeX to PDF. Check syntax.');
    } finally {
      setCompiling(false);
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
    } catch (error: any) {
      console.error('File extraction error:', error);
      toast.error(error.message || 'Failed to extract text from file.');
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

  return (
    <Card className="mx-auto w-full max-w-6xl border-gray-200/80 shadow-sm dark:border-gray-800">
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
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Job Description *
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
                rows={7}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Paste the target role description here..."
              />
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

        {latexCode && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="flex min-h-[520px] flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950 md:h-[760px] md:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  <FileText className="h-4 w-4 text-blue-500" />
                  LaTeX Source
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {latexWords} words {lastSavedAt ? `| Draft saved ${lastSavedAt}` : ''}
                </p>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button variant="ghost" size="sm" className="h-9 flex-1 rounded-lg px-3 sm:h-8 sm:flex-none" onClick={handleCopy}>
                    {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
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
                className="flex-1 min-h-[360px] w-full resize-none overflow-y-auto rounded-xl border border-gray-300 bg-gray-50 p-3 font-mono text-xs text-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 md:p-4"
                spellCheck={false}
              />
            </div>

            <div className="flex min-h-[520px] flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950 md:h-[760px] md:p-4">
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
                  <iframe src={pdfUrl} className="h-full w-full border-none" title="Live Preview of Generated Resume PDF" />
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">PDF preview will appear here</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Wand2, Loader2, Copy, Check, FileText, Download, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../components/ui/Toast';
import apiClient, { getErrorMessage } from '../../../lib/api';

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const compilePdf = async (code: string) => {
    setCompiling(true);
    try {
      const response = await apiClient.post('/resumes/compile-latex', 
        { latex: code }, 
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          <CardTitle>Overleaf-style AI Resume Generator</CardTitle>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate an ATS-friendly LaTeX resume (Jake's Resume template) from a job description.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Description *
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Paste the job description here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attach Your Current Resume (Optional PDF/DOCX)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={extracting}
                />
                <div role="button" className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm border ${extracting ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}`}>
                  {extracting ? 'Extracting...' : 'Upload File'}
                </div>
              </label>
              
              {currentResumeFilename && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md">
                  <Check className="h-4 w-4" />
                  <span className="font-medium truncate max-w-[200px]">{currentResumeFilename}</span>
                  <button type="button" onClick={handleClearResume} className="ml-2 text-gray-400 hover:text-red-500" title="Remove attached resume">
                    &times;
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The AI will extract your details from this document and perfectly map them to the LaTeX template based on the Job Description.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ⚠️ AI Generated Content
            </p>
            <Button type="submit" disabled={generating} className="min-w-[180px]">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate LaTeX Resume
                </>
              )}
            </Button>
          </div>
        </form>

        {latexCode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 border-t pt-6">
            {/* Left Side: LaTeX Editor */}
            <div className="flex flex-col h-[800px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  LaTeX Source
                </h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="default" size="sm" onClick={() => compilePdf(latexCode)} disabled={compiling}>
                    {compiling ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
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
                className="flex-1 w-full p-4 font-mono text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
                spellCheck={false}
              />
            </div>

            {/* Right Side: PDF Preview */}
            <div className="flex flex-col h-[800px]">
               <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold opacity-0">Preview</h3>
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={!pdfUrl}>
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
              </div>
              <div className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden relative flex items-center justify-center">
                {compiling ? (
                  <div className="flex flex-col items-center text-gray-500">
                     <Loader2 className="h-8 w-8 animate-spin mb-2" />
                     <p>Compiling LaTeX...</p>
                  </div>
                ) : pdfUrl ? (
                  <iframe src={pdfUrl} className="w-full h-full border-none" title="Live Preview of Generated Resume PDF" />
                ) : (
                  <div className="text-gray-400">PDF will appear here</div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

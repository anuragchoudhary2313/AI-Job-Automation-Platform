import { useState } from 'react';
import { Wand2, Loader2, Copy, Check, Briefcase, GraduationCap, Code, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../components/ui/Toast';
import apiClient, { getErrorMessage, type StructuredResume } from '../../../lib/api';

export function ResumeGenerator() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeData, setResumeData] = useState<StructuredResume | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setGenerating(true);
    setProgress('Analyzing job description...');
    setResumeData(null);

    try {
      const progressTimer1 = setTimeout(() => setProgress('Structuring resume data...'), 1500);
      const progressTimer2 = setTimeout(() => setProgress('Optimizing keywords...'), 3000);

      const response = await apiClient.post<StructuredResume>('/ai/resume/generate-structured', {
        job_description: jobDescription
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      setResumeData(response.data);
      toast.success('Resume generated successfully!');

    } catch (error: any) {
      console.error('AI Generation Error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const handleCopy = () => {
    if (!resumeData) return;
    const textContext = JSON.stringify(resumeData, null, 2);
    navigator.clipboard.writeText(textContext);
    setCopied(true);
    toast.success('Copied JSON to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          <CardTitle>AI Resume Generator</CardTitle>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate a structured, keyword-optimized resume based on job description.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
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

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ⚠️ AI Generated Content
            </p>
            <Button type="submit" disabled={generating} className="min-w-[180px]">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {progress || 'Generating...'}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Structured Resume
                </>
              )}
            </Button>
          </div>
        </form>

        {resumeData && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">Generated Resume</h3>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied JSON' : 'Copy JSON'}
              </Button>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium text-purple-600 dark:text-purple-400">
                <FileText className="h-4 w-4" /> Professional Summary
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                {resumeData.summary}
              </p>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium text-purple-600 dark:text-purple-400">
                <Code className="h-4 w-4" /> Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-100 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-medium text-purple-600 dark:text-purple-400">
                <Briefcase className="h-4 w-4" /> Experience
              </h4>
              {resumeData.experience.map((exp, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h5 className="font-semibold text-sm mb-2">{exp.title}</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {exp.content.map((point, j) => (
                      <li key={j} className="text-sm text-gray-600 dark:text-gray-400">{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-medium text-purple-600 dark:text-purple-400">
                <GraduationCap className="h-4 w-4" /> Education
              </h4>
              {resumeData.education.map((edu, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <h5 className="font-semibold text-sm">{edu.title}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{edu.content.join(', ')}</p>
                </div>
              ))}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}


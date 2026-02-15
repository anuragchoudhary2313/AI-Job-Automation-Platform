import { useState } from 'react';
import { Mail, Send, TestTube } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../components/ui/Toast';
import apiClient, { getErrorMessage } from '../../../lib/api';

export function EmailAutomation() {
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    recipient_email: '',
    company_name: '',
    job_role: '',
    candidate_name: '',
    skills: '',
    portfolio_link: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeFile) {
      toast.error('Please select a resume file');
      return;
    }

    setSending(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('recipient_email', formData.recipient_email);
      formDataToSend.append('company_name', formData.company_name);
      formDataToSend.append('job_role', formData.job_role);
      formDataToSend.append('candidate_name', formData.candidate_name);
      formDataToSend.append('skills', formData.skills);
      formDataToSend.append('portfolio_link', formData.portfolio_link);
      formDataToSend.append('resume', resumeFile);

      await apiClient.post('/email/send/hr', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Email queued for sending!');

      // Reset form
      setFormData({
        recipient_email: '',
        company_name: '',
        job_role: '',
        candidate_name: '',
        skills: '',
        portfolio_link: '',
      });
      setResumeFile(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      await apiClient.get('/email/test');
      toast.success('Test email queued!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            <CardTitle>Email Automation</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestEmail}
            disabled={testing}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Sending...' : 'Test Email'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Email *
              </label>
              <input
                type="email"
                name="recipient_email"
                value={formData.recipient_email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="hr@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Role *
              </label>
              <input
                type="text"
                name="job_role"
                value={formData.job_role}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Senior Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Candidate Name *
              </label>
              <input
                type="text"
                name="candidate_name"
                value={formData.candidate_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Portfolio Link *
              </label>
              <input
                type="url"
                name="portfolio_link"
                value={formData.portfolio_link}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://portfolio.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resume File *
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {resumeFile && (
                <p className="text-xs text-gray-500 mt-1">{resumeFile.name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skills *
            </label>
            <textarea
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="React, Node.js, TypeScript, Python..."
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={sending}
              className="min-w-[150px]"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

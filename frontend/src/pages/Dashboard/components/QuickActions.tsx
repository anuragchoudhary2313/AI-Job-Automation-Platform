import { Play, Settings, Mail, FileText, ArrowRight } from 'lucide-react';
import apiClient from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

export function QuickActions({ loading }: { loading?: boolean }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  if (loading) return null;

  const handleAutoApply = async () => {
    try {
      toast.loading('Starting Multi-Agent Orchestration...', { id: 'auto-apply' });
      await apiClient.post('/agent/multi-apply', {
        keyword: 'Software Engineer',
        location: 'Remote',
        limit: 5
      });
      toast.success('Autonomous agents dispatched!', { id: 'auto-apply' });
    } catch (e) {
      toast.error('Failed to trigger auto-apply sequence.', { id: 'auto-apply' });
    }
    // navigate('/jobs'); // Uncomment when ready
  };

  const handleColdEmails = () => {
    toast.info('Cold Email feature coming soon!');
    // navigate('/email'); // Uncomment when ready
  };

  const handleOptimizeResume = () => {
    navigate('/resumes');
  };

  const handleBotSettings = () => {
    navigate('/settings');
  };

  return (
    <Card className="border-gray-200/80 dark:border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
        <CardDescription>Launch frequent workflows in one click</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={handleAutoApply}
          className="group rounded-xl border border-sky-200 bg-sky-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm dark:border-sky-900/70 dark:bg-sky-900/20"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-gray-900 dark:text-sky-300">
            <Play className="h-3.5 w-3.5" />
            Auto Apply
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Start orchestration</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Trigger multi-agent application flow for fresh matches.</p>
          <span className="mt-2 inline-flex items-center text-xs font-semibold text-sky-700 group-hover:gap-1 dark:text-sky-300">
            Run now <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </span>
        </button>

        <button
          onClick={handleColdEmails}
          className="group rounded-xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-sm dark:border-amber-900/70 dark:bg-amber-900/20"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-gray-900 dark:text-amber-300">
            <Mail className="h-3.5 w-3.5" />
            Outreach
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Send cold emails</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Open outbound campaigns with tailored company messaging.</p>
          <span className="mt-2 inline-flex items-center text-xs font-semibold text-amber-700 group-hover:gap-1 dark:text-amber-300">
            Open feature <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </span>
        </button>

        <button
          onClick={handleOptimizeResume}
          className="group rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm dark:border-emerald-900/70 dark:bg-emerald-900/20"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-gray-900 dark:text-emerald-300">
            <FileText className="h-3.5 w-3.5" />
            Resume
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Optimize resume</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Align resume language with target role requirements.</p>
          <span className="mt-2 inline-flex items-center text-xs font-semibold text-emerald-700 group-hover:gap-1 dark:text-emerald-300">
            Go to resumes <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </span>
        </button>

        <button
          onClick={handleBotSettings}
          className="group rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900/60"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-900 dark:text-gray-200">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Configure bot</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Tune automation limits, sources, and behavior rules.</p>
          <span className="mt-2 inline-flex items-center text-xs font-semibold text-gray-700 group-hover:gap-1 dark:text-gray-300">
            Open settings <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </span>
        </button>

        <div className="sm:col-span-2">
          <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate('/jobs')}>
            View full job pipeline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

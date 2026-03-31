import { MetricsRow, type MetricData } from './components/MetricsRow';
import { ChartsSection } from './components/ChartsSection';
import { ActivityFeed } from './components/ActivityFeed';
import { QuickActions } from './components/QuickActions';
import { EmailAutomation } from './components/EmailAutomation';
import { useWebSocket } from '../../hooks/useWebSocket';
import { toast } from '@/components/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '../../services/job.service';
import { Briefcase, TrendingUp, CheckCircle, Mail, ArrowRight, Sparkles, Activity as ActivityIcon } from 'lucide-react';
import { useFeatures } from '../../contexts/FeatureContext';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isEnabled } = useFeatures();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['jobStats'],
    queryFn: () => jobService.getStats()
  });

  const loading = statsLoading;

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    onConnect: () => {
      console.log('Dashboard: WebSocket connected');
    },
    onDisconnect: () => {
      console.log('Dashboard: WebSocket disconnected');
    },
    onMessage: (message: unknown) => {
      // Handle different message types
      const msgData = message as { type?: string, data?: { message?: string } };
      if (msgData.type === 'notification') {
        toast.success(msgData.data?.message || 'New notification');
      } else if (msgData.type === 'error') {
        toast.error(msgData.data?.message || 'An error occurred');
      }
    },
  });

  // Calculate metrics from stats
  const statTotal = Number(stats?.total) || 0;
  const statApplied = Number(stats?.applied) || 0;
  const statInterview = Number(stats?.interview) || 0;
  const statPending = Number(stats?.pending) || 0;
  const responseRate = statApplied ? ((statInterview / statApplied) * 100) : 0;

  const metrics: MetricData[] = stats ? [
    { title: 'Total Jobs', value: statTotal, change: 12, icon: Briefcase, trend: 'up', color: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/30' },
    { title: 'Applied', value: statApplied, change: 7, icon: TrendingUp, trend: 'up', color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30' },
    { title: 'Interviewing', value: statInterview, change: 5, icon: CheckCircle, trend: 'up', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Response Rate', value: responseRate, change: responseRate > 15 ? 3 : -2, icon: Mail, trend: responseRate > 15 ? 'up' : 'down', color: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30' },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-[#f6fbff] via-[#f7fff9] to-[#fff8ee] p-5 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 md:p-7">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-900/30" />
        <div className="absolute -bottom-14 left-8 h-44 w-44 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-900/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:border-cyan-800 dark:bg-gray-900 dark:text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Automation Command Center
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400 md:text-base">
              Track application momentum, monitor agent activity, and launch high-impact actions from one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs text-gray-500 dark:text-gray-400">Open Pipeline</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{statPending}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs text-gray-500 dark:text-gray-400">Live Feed</p>
              <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                <ActivityIcon className="h-4 w-4" />
                {isConnected ? 'Connected' : 'Offline'}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-gray-200 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70 sm:col-span-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Interview Yield</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{responseRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-3">
          <Button className="rounded-xl" onClick={() => navigate('/jobs')}>
            Review Jobs
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/resumes')}>
            Optimize Resume
          </Button>
        </div>
      </section>

      <MetricsRow loading={loading} metrics={metrics.length ? metrics : undefined} />
      <ChartsSection loading={loading} />

      {/* Email Automation Section */}
      {isEnabled('email_automation') && <EmailAutomation />}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ActivityFeed loading={loading} />
        </div>
        <div className="space-y-6">
          <QuickActions loading={loading} />
        </div>
      </div>
    </div>
  );
}

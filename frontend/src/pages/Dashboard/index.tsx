import { MetricsRow, type MetricData } from './components/MetricsRow';
import { ChartsSection } from './components/ChartsSection';
import { ActivityFeed } from './components/ActivityFeed';
import { QuickActions } from './components/QuickActions';
import { EmailAutomation } from './components/EmailAutomation';
import { useWebSocket } from '../../hooks/useWebSocket';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '../../services/job.service';
import { Briefcase, TrendingUp, CheckCircle, Mail } from 'lucide-react';
import { useFeatures } from '../../contexts/FeatureContext';

export default function Dashboard() {
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

  const metrics: MetricData[] = stats ? [
    { title: 'Total Jobs', value: statTotal, change: 0, icon: Briefcase, trend: 'up', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Applied', value: statApplied, change: 0, icon: TrendingUp, trend: 'up', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30' },
    { title: 'Interviewing', value: statInterview, change: 0, icon: CheckCircle, trend: 'up', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Response Rate', value: statApplied ? ((statInterview / statApplied) * 100) : 0, change: 0, icon: Mail, trend: 'up', color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30' },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back! Here's your overview.
            {isConnected && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </p>
        </div>
      </div>

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

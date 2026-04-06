import { useState } from 'react';
import { Check, Mail, AlertCircle, FileText, Briefcase, Wifi, WifiOff } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';
import { useWebSocket, type Activity } from '../../../hooks/useWebSocket';
import { motion, AnimatePresence } from 'framer-motion';

const initialActivities: Activity[] = [
  { id: '1', type: 'apply', title: 'Applied to Senior Engineer at Google', description: 'Bot #1 successfully submitted application via LinkedIn', time: '2 mins ago', timestamp: Date.now() - 120000 },
  { id: '2', type: 'email', title: 'Follow-up Email Sent', description: 'Sent follow-up to HR at Microsoft', time: '15 mins ago', timestamp: Date.now() - 900000 },
  { id: '3', type: 'error', title: 'Scraping Failed', description: 'Could not parse job description on Indeed for Job #4421', time: '1 hour ago', timestamp: Date.now() - 3600000 },
  { id: '4', type: 'resume', title: 'Resume Regenerated', description: 'Optimized "Frontend_V2.pdf" for keyword match', time: '2 hours ago', timestamp: Date.now() - 7200000 },
];

export function ActivityFeed({ loading }: { loading?: boolean }) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [showNewBadge, setShowNewBadge] = useState(false);

  const { isConnected } = useWebSocket({
    onActivity: (newActivity) => {
      // Drop repeated socket messages that can occur on reconnect/multi-tab fanout.
      setActivities((prev) => {
        const duplicateWindowMs = 8000;
        const isDuplicate = prev.some((item) => {
          const sameKind = item.type === newActivity.type;
          const sameTitle = item.title.trim().toLowerCase() === newActivity.title.trim().toLowerCase();
          const sameDescription =
            item.description.trim().toLowerCase() === newActivity.description.trim().toLowerCase();
          const nearInTime = Math.abs(item.timestamp - newActivity.timestamp) <= duplicateWindowMs;

          return sameKind && sameTitle && sameDescription && nearInTime;
        });

        if (isDuplicate) {
          return prev;
        }

        return [newActivity, ...prev].slice(0, 10);
      });
      setShowNewBadge(true);
      setTimeout(() => setShowNewBadge(false), 3000);
    },
  });

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="w-px h-full bg-gray-200 dark:bg-gray-800 my-2" />
                </div>
                <div className="pb-8 w-full space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'apply': return <Check className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'resume': return <FileText className="w-4 h-4" />;
      case 'scraping': return <Briefcase className="w-4 h-4" />;
      default: return <Check className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'apply': return "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400";
      case 'email': return "border-purple-100 bg-purple-50 text-purple-600 dark:border-purple-900 dark:bg-purple-900/20 dark:text-purple-400";
      case 'error': return "border-red-100 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400";
      case 'resume': return "border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-400";
      case 'scraping': return "border-green-100 bg-green-50 text-green-600 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400";
      default: return "border-gray-100 bg-gray-50 text-gray-600 dark:border-gray-900 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <Card className="border-gray-200/80 dark:border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
            <CardDescription>Real-time log of bot actions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showNewBadge && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
              >
                New
              </motion.span>
            )}
            {isConnected ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <Wifi className="w-3.5 h-3.5" />
                <span>Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex"
              >
                <div className="flex flex-col items-center mr-4">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                    getActivityColor(activity.type)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="my-2 h-full w-px bg-gray-200 dark:bg-gray-800" />
                  )}
                </div>
                <div className="flex-1 pb-5 last:pb-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.description}</p>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Activities will appear here in real-time</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

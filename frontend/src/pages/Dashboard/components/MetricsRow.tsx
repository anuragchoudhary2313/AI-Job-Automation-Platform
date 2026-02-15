import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Briefcase, Mail, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AnimatedCounter } from '../../../components/ui/AnimatedCounter';
import { Skeleton } from '../../../components/ui/Skeleton';
import { cn } from '../../../lib/utils';



const defaultMetrics: MetricData[] = [
  { title: 'Total Jobs', value: 0, change: 0, icon: Briefcase, trend: 'up', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
  { title: 'Applied', value: 0, change: 0, icon: TrendingUp, trend: 'up', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30' },
  { title: 'Interviewing', value: 0, change: 0, icon: CheckCircle, trend: 'down', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
  { title: 'Response Rate', value: 0, change: 0, icon: Mail, trend: 'up', color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
} as const;

export interface MetricData {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  trend: 'up' | 'down';
  color: string;
}

export function MetricsRow({ loading, metrics }: { loading?: boolean; metrics?: MetricData[] }) {
  const displayMetrics = metrics || defaultMetrics;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {displayMetrics.map((metric) => (
        <motion.div key={metric.title} variants={item}>
          <Card hoverable className="dark:hover:border-gray-700 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {metric.title}
              </CardTitle>
              <div className={cn("p-2 rounded-full", metric.color)}>
                <metric.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.title === 'Response Rate' ? (
                  <>
                    <AnimatedCounter
                      value={metric.value as number}
                      format={(v) => v.toFixed(1)}
                    />%
                  </>
                ) : (
                  <AnimatedCounter value={metric.value as number} />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={metric.trend === 'up' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                  {Math.abs(metric.change)}%
                </span>
                <span className="ml-1 opacity-70">from last month</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

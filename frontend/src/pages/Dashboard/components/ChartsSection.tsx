import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ChartSkeleton } from '../../../components/ui/ChartSkeleton';
import { AnimatedCounter } from '../../../components/ui/AnimatedCounter';
import { useQuery } from '@tanstack/react-query';
import { jobService, type Job } from '../../../services/job.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';

const DASHBOARD_RANGE_KEY = 'dashboard-chart-range-v1';
const RANGE_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
] as const;

type RangeDays = (typeof RANGE_OPTIONS)[number]['days'];

interface DailyPoint {
  date: string;
  total: number;
  applied: number;
}

interface StatusPoint {
  name: string;
  value: number;
}

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

const formatRangeLabel = (date: Date, days: number) => {
  if (days <= 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const parseJobDate = (job: Job): Date | null => {
  const raw = job.applied_at || job.created_at || job.date_posted;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const isAppliedLike = (status: Job['status']) => {
  return status === 'applied' || status === 'interviewing' || status === 'offered';
};

const createChartData = (jobs: Job[], days: RangeDays) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const dailyMap = new Map<string, { total: number; applied: number }>();
  const labelByKey = new Map<string, string>();

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    labelByKey.set(key, formatRangeLabel(d, days));
    dailyMap.set(key, { total: 0, applied: 0 });
  }

  let appliedCount = 0;
  let reviewCount = 0;
  let interviewCount = 0;
  let rejectedCount = 0;

  for (const job of jobs) {
    const date = parseJobDate(job);
    if (!date) continue;
    if (date < start || date > now) continue;

    const key = date.toISOString().slice(0, 10);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;

    bucket.total += 1;
    if (isAppliedLike(job.status)) {
      bucket.applied += 1;
    }

    if (job.status === 'applied') appliedCount += 1;
    if (job.status === 'pending') reviewCount += 1;
    if (job.status === 'interviewing' || job.status === 'offered') interviewCount += 1;
    if (job.status === 'rejected' || job.status === 'failed') rejectedCount += 1;
  }

  const dailyData: DailyPoint[] = Array.from(dailyMap.entries()).map(([key, value]) => ({
    date: labelByKey.get(key) || key,
    total: value.total,
    applied: value.applied,
  }));

  const statusData: StatusPoint[] = [
    { name: 'Applied', value: appliedCount },
    { name: 'Review', value: reviewCount },
    { name: 'Interview', value: interviewCount },
    { name: 'Rejected', value: rejectedCount },
  ];

  return { dailyData, statusData };
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color?: string; name?: string; value?: number | string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="animate-in fade-in duration-200 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
        {payload.map((entry: { color?: string; name?: string; value?: number | string }, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Pie Tooltip
const CustomPieTooltip = ({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { color?: string; name?: string; value?: number | string }[];
  total: number;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data) return null;
    const safeTotal = total || 1;
    const percentage = ((Number(data.value || 0) / safeTotal) * 100).toFixed(1);

    return (
      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in duration-200">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{data.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{data.value}</span> applications
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{percentage}% of total</p>
      </div>
    );
  }
  return null;
};

export function ChartsSection({ loading }: { loading?: boolean }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hiddenSegments, setHiddenSegments] = useState<Set<number>>(new Set());
  const [timeRange, setTimeRange] = useState<RangeDays>(7);

  useEffect(() => {
    const stored = window.localStorage.getItem(DASHBOARD_RANGE_KEY);
    if (!stored) return;

    const parsed = Number(stored);
    if (parsed === 7 || parsed === 30 || parsed === 90) {
      setTimeRange(parsed);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_RANGE_KEY, String(timeRange));
  }, [timeRange]);

  const { data: jobs = [], isLoading: jobsLoading, isFetching } = useQuery({
    queryKey: ['dashboardChartsJobs', timeRange],
    queryFn: () => jobService.getJobs({ limit: 1000, skip: 0 }),
    staleTime: 60_000,
  });

  const { dailyData, statusData } = useMemo(() => createChartData(jobs, timeRange), [jobs, timeRange]);

  const handleLegendClick = (index: number) => {
    setHiddenSegments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const visibleData = statusData.filter((_, index) => !hiddenSegments.has(index));
  const totalActive = visibleData.reduce((sum, item) => sum + item.value, 0);
  const showLoading = loading || jobsLoading;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Insights</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Using real pipeline data from the last {timeRange} days</p>
        </div>

        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.days}
              size="sm"
              variant={timeRange === option.days ? 'primary' : 'ghost'}
              className="h-8 rounded-lg px-3"
              onClick={() => setTimeRange(option.days)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showLoading ? (
          <motion.div
            key="charts-loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-7"
          >
            <div className="col-span-4">
              <ChartSkeleton />
            </div>
            <div className="col-span-3">
              <ChartSkeleton />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="charts-data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-7"
          >
            {/* Main Bar Chart */}
            <Card className="col-span-4 border-gray-200/80 dark:border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold">Application Volume</CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Daily jobs discovered vs moved into applied stages</p>
                  </div>
                  {isFetching && <span className="text-xs text-gray-500 dark:text-gray-400">Updating...</span>}
                </div>
              </CardHeader>
              <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6b7280" opacity={0.18} />
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.12)' }} />
                      <Bar
                        dataKey="total"
                        fill="#0ea5e9"
                        radius={[4, 4, 0, 0]}
                        name="Discovered"
                        isAnimationActive={true}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                      <Bar
                        dataKey="applied"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        name="Applied Stage"
                        isAnimationActive={true}
                        animationDuration={900}
                        animationEasing="ease-out"
                        animationBegin={120}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart Status */}
            <Card className="col-span-3 border-gray-200/80 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Pipeline Status</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">Click legends to filter segments</p>
              </CardHeader>
              <CardContent>
                <div className="relative h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visibleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        {visibleData.map((entry, index) => {
                          const originalIndex = statusData.indexOf(entry);
                          const isActive = activeIndex === index;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[originalIndex % COLORS.length]}
                              opacity={isActive ? 1 : 0.82}
                              style={{
                                filter: isActive ? 'brightness(1.1)' : 'brightness(1)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                              }}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip total={statusData.reduce((sum, item) => sum + item.value, 0)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        <AnimatedCounter value={totalActive} />
                      </div>
                      <div className="text-xs text-gray-500">Total Active</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                  {statusData.map((entry, index) => {
                    const isHidden = hiddenSegments.has(index);
                    return (
                      <button
                        key={entry.name}
                        onClick={() => handleLegendClick(index)}
                        className={`cursor-pointer flex items-center gap-2 transition-all duration-200 hover:scale-105 ${
                          isHidden ? 'opacity-40' : 'opacity-100'
                        }`}
                      >
                        <div
                          className="h-3 w-3 rounded-full transition-transform duration-200"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                            transform: isHidden ? 'scale(0.8)' : 'scale(1)',
                          }}
                        />
                        <span className={`text-gray-600 dark:text-gray-400 ${isHidden ? 'line-through' : ''}`}>
                          {entry.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ChartSkeleton } from '../../../components/ui/ChartSkeleton';
import { AnimatedCounter } from '../../../components/ui/AnimatedCounter';

const dailyData = [
  { date: 'Mon', jobs: 12, manual: 4 },
  { date: 'Tue', jobs: 18, manual: 6 },
  { date: 'Wed', jobs: 15, manual: 3 },
  { date: 'Thu', jobs: 24, manual: 8 },
  { date: 'Fri', jobs: 28, manual: 12 },
  { date: 'Sat', jobs: 8, manual: 2 },
  { date: 'Sun', jobs: 5, manual: 0 },
];

const statusData = [
  { name: 'Applied', value: 450 },
  { name: 'Review', value: 120 },
  { name: 'Interview', value: 45 },
  { name: 'Rejected', value: 180 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in duration-200">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
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
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = statusData.reduce((sum, item) => sum + item.value, 0);
    const percentage = ((data.value / total) * 100).toFixed(1);

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

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ChartSkeleton />
        </div>
        <div className="col-span-3">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      {/* Main Bar Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Application Volume</CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
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
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                <Bar
                  dataKey="jobs"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Auto Apply"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="manual"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="Manual"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  animationBegin={200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart Status */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full relative">
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
                        opacity={isActive ? 1 : 0.8}
                        style={{
                          filter: isActive ? 'brightness(1.1)' : 'brightness(1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
                  className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 cursor-pointer ${isHidden ? 'opacity-40' : 'opacity-100'
                    }`}
                >
                  <div
                    className="h-3 w-3 rounded-full transition-transform duration-200"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                      transform: isHidden ? 'scale(0.8)' : 'scale(1)'
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
    </div>
  );
}

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

/**
 * Memoized metric card component
 * Only re-renders when props change
 */
export const MetricCard = memo(function MetricCard({
  title,
  value,
  change,
  icon,
  color
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!change) return <Minus className="w-4 h-4" />;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!change) return 'text-gray-500';
    if (change > 0) return 'text-green-500';
    return 'text-red-500';
  };

  return (
    <motion.div 
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/20 dark:border-gray-800/50 rounded-xl shadow-sm p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-lg bg-opacity-10 backdrop-blur-sm ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-xs font-semibold">
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 tracking-tight">
          {title}
        </h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tighter">
          {value.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
});

export default MetricCard;

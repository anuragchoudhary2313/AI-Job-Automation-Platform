import * as React from 'react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';

interface MetricTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trendText?: string;
  className?: string;
}

export function MetricTile({ title, value, subtitle, icon, trendText, className }: MetricTileProps) {
  return (
    <Card className={cn('border-gray-200/80 dark:border-gray-800', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{title}</CardDescription>
          {icon ? <span className="text-gray-400 dark:text-gray-500">{icon}</span> : null}
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {(subtitle || trendText) && (
        <CardContent className="pt-0">
          {subtitle ? <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
          {trendText ? <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{trendText}</p> : null}
        </CardContent>
      )}
    </Card>
  );
}

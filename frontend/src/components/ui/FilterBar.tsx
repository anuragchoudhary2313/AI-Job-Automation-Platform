import * as React from 'react';
import { cn } from '../../lib/utils';

interface FilterBarProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

export function FilterBar({ children, actions, sticky = false, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-surface/90 p-3 dark:border-gray-800 dark:bg-gray-950/70',
        sticky && 'sticky top-20 z-20',
        className
      )}
      data-testid="filter-bar"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

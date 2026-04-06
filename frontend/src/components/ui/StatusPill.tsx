import * as React from 'react';
import { cn } from '../../lib/utils';

export type StatusState =
  | 'queued'
  | 'running'
  | 'blocked'
  | 'failed'
  | 'replayed'
  | 'ignored'
  | 'completed';

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: StatusState;
  label?: string;
  icon?: React.ReactNode;
}

const defaultLabels: Record<StatusState, string> = {
  queued: 'Queued',
  running: 'Running',
  blocked: 'Blocked',
  failed: 'Failed',
  replayed: 'Replayed',
  ignored: 'Ignored',
  completed: 'Completed',
};

const stateClasses: Record<StatusState, string> = {
  queued: 'bg-status-info/15 text-status-info dark:bg-status-info/20 dark:text-sky-300',
  running: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  blocked: 'bg-status-warning/15 text-status-warning dark:bg-status-warning/20 dark:text-amber-300',
  failed: 'bg-status-danger/15 text-status-danger dark:bg-status-danger/20 dark:text-red-300',
  replayed: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  ignored: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  completed: 'bg-status-success/15 text-status-success dark:bg-status-success/20 dark:text-emerald-300',
};

export function StatusPill({ state, label, icon, className, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
        stateClasses[state],
        className
      )}
      {...props}
    >
      {icon}
      {label ?? defaultLabels[state]}
    </span>
  );
}

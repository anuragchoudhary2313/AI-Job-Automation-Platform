import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertOctagon, RefreshCcw, ShieldBan, ShieldCheck, Clock3, Wrench } from 'lucide-react';
import apiClient, { getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { FilterBar } from '../../../components/ui/FilterBar';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusPill } from '../../../components/ui/StatusPill';
import { toast } from '../../../components/ui/Toast';

type DeadLetter = {
  id: string;
  source: string;
  stage: string;
  task_name: string;
  error_message: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  retry_count: number;
  status: 'open' | 'replayed' | 'ignored';
  created_at: string;
};

const timeAgo = (isoDate: string): string => {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

export function AutomationDeadLetters() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'open' | 'ignored' | 'replayed' | 'all'>('open');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'orchestrator_agent' | 'bot_service'>('all');
  const [limit, setLimit] = useState(20);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['automationDeadLetters', statusFilter, sourceFilter, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      const response = await apiClient.get<DeadLetter[]>(`/agent/dead-letters?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 15000,
  });

  const replayMutation = useMutation({
    mutationFn: async (deadLetterId: string) => {
      await apiClient.post(`/agent/dead-letters/${deadLetterId}/replay`);
    },
    onSuccess: () => {
      toast.success('Replay queued successfully.');
      queryClient.invalidateQueries({ queryKey: ['automationDeadLetters'] });
      queryClient.invalidateQueries({ queryKey: ['automationEvents'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ deadLetterId, status }: { deadLetterId: string; status: 'open' | 'ignored' | 'replayed' }) => {
      await apiClient.post(`/agent/dead-letters/${deadLetterId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationDeadLetters'] });
      queryClient.invalidateQueries({ queryKey: ['automationEvents'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const rows = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return (
      <Card className="border-gray-200/80 dark:border-gray-800">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/80 dark:border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold">Dead-Letter Queue</CardTitle>
            <CardDescription>Failed automation tasks with replay and resolution controls</CardDescription>
          </div>
          {isFetching && <span className="text-xs text-gray-500 dark:text-gray-400">Refreshing...</span>}
        </div>

        <FilterBar className="mt-2 border-0 bg-transparent p-0 dark:border-0 dark:bg-transparent">
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              value={statusFilter}
              onChange={(e) => {
                setLimit(20);
                setStatusFilter(e.target.value as typeof statusFilter);
              }}
            >
              <option value="open">Open</option>
              <option value="ignored">Ignored</option>
              <option value="replayed">Replayed</option>
              <option value="all">All Statuses</option>
            </select>

            <select
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              value={sourceFilter}
              onChange={(e) => {
                setLimit(20);
                setSourceFilter(e.target.value as typeof sourceFilter);
              }}
            >
              <option value="all">All Sources</option>
              <option value="orchestrator_agent">Orchestrator</option>
              <option value="bot_service">Bot Service</option>
            </select>
          </div>
        </FilterBar>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No dead-letter items for the selected filters.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const canReplay = row.source === 'orchestrator_agent' || row.source === 'bot_service';
              const replayBusy = replayMutation.isPending;
              const statusBusy = statusMutation.isPending;

              return (
                <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {row.source} | {row.task_name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        stage: {row.stage} | retries: {row.retry_count} | status: {row.status}
                      </p>
                    </div>
                    <StatusPill state="failed" icon={<AlertOctagon className="h-3.5 w-3.5" />} />
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-gray-700 dark:text-gray-300">{row.error_message}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {timeAgo(row.created_at)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!canReplay || replayBusy}
                      onClick={() => replayMutation.mutate(row.id)}
                      className="inline-flex items-center rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300"
                    >
                      <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                      Replay
                    </button>

                    {row.status !== 'ignored' ? (
                      <button
                        type="button"
                        disabled={statusBusy}
                        onClick={() => statusMutation.mutate({ deadLetterId: row.id, status: 'ignored' })}
                        className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300"
                      >
                        <ShieldBan className="mr-1 h-3.5 w-3.5" />
                        Ignore
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={statusBusy}
                        onClick={() => statusMutation.mutate({ deadLetterId: row.id, status: 'open' })}
                        className="inline-flex items-center rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-800/60 dark:bg-sky-900/20 dark:text-sky-300"
                      >
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Reopen
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={statusBusy}
                      onClick={() => statusMutation.mutate({ deadLetterId: row.id, status: 'replayed' })}
                      className="inline-flex items-center rounded-lg border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-800/60 dark:bg-violet-900/20 dark:text-violet-300"
                    >
                      <Wrench className="mr-1 h-3.5 w-3.5" />
                      Mark Replayed
                    </button>
                  </div>

                  {row.payload && Object.keys(row.payload).length > 0 && (
                    <pre className="mt-2 max-h-28 overflow-auto rounded bg-gray-50 p-2 text-[11px] text-gray-700 dark:bg-gray-950 dark:text-gray-200">
{JSON.stringify(row.payload, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}

            {rows.length >= limit && (
              <button
                type="button"
                onClick={() => setLimit((prev) => Math.min(prev + 20, 200))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                disabled={isFetching || limit >= 200}
              >
                {isFetching ? 'Loading...' : limit >= 200 ? 'Max Loaded' : 'Load More'}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

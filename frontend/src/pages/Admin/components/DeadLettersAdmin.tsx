import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertOctagon, RefreshCcw, ShieldBan, ShieldCheck, Search, Loader2, BarChart3 } from 'lucide-react';
import apiClient, { getErrorMessage } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { FilterBar } from '../../../components/ui/FilterBar';
import { Input } from '../../../components/ui/Input';
import { MetricTile } from '../../../components/ui/MetricTile';
import { Button } from '../../../components/ui/Button';
import { StatusPill } from '../../../components/ui/StatusPill';
import { toast } from '../../../components/ui/Toast';

type DeadLetterStatus = 'open' | 'ignored' | 'replayed' | 'all';
type DeadLetterSource = 'all' | 'orchestrator_agent' | 'bot_service';

type DeadLetterRow = {
  id: string;
  user_id?: string | null;
  source: string;
  stage: string;
  task_name: string;
  error_message: string;
  status: 'open' | 'ignored' | 'replayed';
  retry_count: number;
  created_at: string;
  payload?: Record<string, unknown>;
};

type OffsetPaginatedResponse<T> = {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
};

type DeadLetterMetrics = {
  total: number;
  open: number;
  ignored: number;
  replayed: number;
  by_source: {
    orchestrator_agent: number;
    bot_service: number;
  };
  last_24h: {
    queued: number;
    success: number;
    error: number;
    blocked: number;
  };
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

export function DeadLettersAdmin() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<DeadLetterStatus>('open');
  const [sourceFilter, setSourceFilter] = useState<DeadLetterSource>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => {
      setSkip(0);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const listQuery = useQuery({
    queryKey: ['adminDeadLetters', statusFilter, sourceFilter, search, skip, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('include_meta', 'true');
      params.set('skip', String(skip));
      params.set('limit', String(limit));
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (search) params.set('search', search);

      const response = await apiClient.get<OffsetPaginatedResponse<DeadLetterRow>>(`/admin/dead-letters?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 15000,
  });

  const metricsQuery = useQuery({
    queryKey: ['adminDeadLetterMetrics'],
    queryFn: async () => {
      const response = await apiClient.get<DeadLetterMetrics>('/admin/dead-letters/metrics');
      return response.data;
    },
    refetchInterval: 15000,
  });

  const replayMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/dead-letters/${id}/replay`);
    },
    onSuccess: () => {
      toast.success('Replay queued.');
      queryClient.invalidateQueries({ queryKey: ['adminDeadLetters'] });
      queryClient.invalidateQueries({ queryKey: ['adminDeadLetterMetrics'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'open' | 'ignored' | 'replayed' }) => {
      await apiClient.post(`/admin/dead-letters/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDeadLetters'] });
      queryClient.invalidateQueries({ queryKey: ['adminDeadLetterMetrics'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const total = listQuery.data?.total ?? 0;
  const hasMore = Boolean(listQuery.data?.has_more);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile title="Total Dead Letters" value={metricsQuery.data?.total ?? 0} />
        <MetricTile
          title="Open Backlog"
          value={metricsQuery.data?.open ?? 0}
          className="text-amber-600 dark:text-amber-400"
        />
        <MetricTile
          title="Replay Success 24h"
          value={metricsQuery.data?.last_24h.success ?? 0}
          className="text-emerald-600 dark:text-emerald-400"
        />
        <MetricTile
          title="Replay Blocked 24h"
          value={metricsQuery.data?.last_24h.blocked ?? 0}
          className="text-red-600 dark:text-red-400"
        />
      </div>

      <Card className="border-gray-200/80 dark:border-gray-800">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold">Dead-Letter Replay Control</CardTitle>
              <CardDescription>Admin replay queue with policy gates, search, and pagination</CardDescription>
            </div>
            {(listQuery.isFetching || metricsQuery.isFetching) && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>

          <FilterBar className="mt-2 border-0 bg-transparent p-0 dark:border-0 dark:bg-transparent">
            <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search source, task, stage, error, user"
                  className="h-9 pl-8"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setSkip(0);
                  setStatusFilter(e.target.value as DeadLetterStatus);
                }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="open">Open</option>
                <option value="ignored">Ignored</option>
                <option value="replayed">Replayed</option>
                <option value="all">All Status</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSkip(0);
                  setSourceFilter(e.target.value as DeadLetterSource);
                }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="all">All Sources</option>
                <option value="orchestrator_agent">Orchestrator</option>
                <option value="bot_service">Bot Service</option>
              </select>
            </div>
          </FilterBar>
        </CardHeader>

        <CardContent>
          {listQuery.isLoading ? (
            <div className="flex h-24 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading dead letters...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No dead letters matched your filters.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {row.source} | {row.task_name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        user: {row.user_id || 'unknown'} | stage: {row.stage} | retries: {row.retry_count}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill
                        state={row.status === 'open' ? 'queued' : row.status === 'replayed' ? 'replayed' : 'ignored'}
                        label={row.status}
                      />
                      <StatusPill state="failed" icon={<AlertOctagon className="h-3.5 w-3.5" />} />
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-gray-700 dark:text-gray-300">{row.error_message}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{timeAgo(row.created_at)}</span>
                    <span>id: {row.id}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                      onClick={() => replayMutation.mutate(row.id)}
                      disabled={replayMutation.isPending}
                    >
                      <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Replay
                    </Button>

                    {row.status !== 'ignored' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                        onClick={() => statusMutation.mutate({ id: row.id, status: 'ignored' })}
                        disabled={statusMutation.isPending}
                      >
                        <ShieldBan className="mr-1 h-3.5 w-3.5" /> Ignore
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300"
                        onClick={() => statusMutation.mutate({ id: row.id, status: 'open' })}
                        disabled={statusMutation.isPending}
                      >
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Reopen
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      onClick={() => statusMutation.mutate({ id: row.id, status: 'replayed' })}
                      disabled={statusMutation.isPending}
                    >
                      <BarChart3 className="mr-1 h-3.5 w-3.5" /> Mark Replayed
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {Math.min(skip + 1, total)}-{Math.min(skip + rows.length, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg"
                    disabled={skip <= 0 || listQuery.isFetching}
                    onClick={() => setSkip((prev) => Math.max(0, prev - limit))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg"
                    disabled={!hasMore || listQuery.isFetching}
                    onClick={() => setSkip((prev) => prev + limit)}
                  >
                    Next
                  </Button>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setSkip(0);
                      setLimit(Number(e.target.value));
                    }}
                    className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    aria-label="Dead-letter page size"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

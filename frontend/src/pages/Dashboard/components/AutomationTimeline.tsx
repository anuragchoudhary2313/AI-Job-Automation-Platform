import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3 } from 'lucide-react';
import apiClient from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusPill, type StatusState } from '../../../components/ui/StatusPill';
import { FilterBar } from '../../../components/ui/FilterBar';

type AutomationEvent = {
  id: string;
  source: string;
  stage: string;
  action: string;
  company?: string | null;
  role?: string | null;
  reason?: string | null;
  ats_score?: number | null;
  passes_gate?: boolean | null;
  override_used?: boolean;
  metadata?: Record<string, unknown>;
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

const getEventState = (event: AutomationEvent): StatusState => {
  if (event.action === 'applied') return 'completed';
  if (event.action === 'override') return 'replayed';
  if (event.action === 'error') return 'failed';
  if (event.action === 'skip') return 'blocked';
  return 'queued';
};

const getEventLabel = (event: AutomationEvent): string => {
  if (event.action === 'applied') return 'Applied';
  if (event.action === 'override') return 'Override';
  if (event.stage === 'ats_gate' && event.action === 'skip') return 'ATS Block';
  if (event.action === 'skip') return 'Skipped';
  if (event.action === 'error') return 'Error';
  return event.action;
};

export function AutomationTimeline() {
  const [sourceFilter, setSourceFilter] = useState<'all' | 'orchestrator_agent' | 'bot_service'>('all');
  const [stageFilter, setStageFilter] = useState<'all' | 'decision' | 'match_gate' | 'policy_gate' | 'ats_gate' | 'apply'>('all');
  const [actionFilter, setActionFilter] = useState<'all' | 'applied' | 'skip' | 'override' | 'error'>('all');
  const [limit, setLimit] = useState(20);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['automationEvents', sourceFilter, stageFilter, actionFilter, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);

      const response = await apiClient.get<AutomationEvent[]>(`/agent/events?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 15000,
  });

  const events = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return (
      <Card className="border-gray-200/80 dark:border-gray-800">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/80 dark:border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold">Automation Timeline</CardTitle>
            <CardDescription>ATS gate and auto-apply audit trail</CardDescription>
          </div>
          {isFetching && <span className="text-xs text-gray-500 dark:text-gray-400">Refreshing...</span>}
        </div>
        <FilterBar
          className="mt-2"
          actions={
            <select
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              value={actionFilter}
              onChange={(e) => {
                setLimit(20);
                setActionFilter(e.target.value as typeof actionFilter);
              }}
            >
              <option value="all">All Actions</option>
              <option value="applied">Applied</option>
              <option value="skip">Skipped</option>
              <option value="override">Override</option>
              <option value="error">Error</option>
            </select>
          }
        >
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

          <select
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            value={stageFilter}
            onChange={(e) => {
              setLimit(20);
              setStageFilter(e.target.value as typeof stageFilter);
            }}
          >
            <option value="all">All Stages</option>
            <option value="decision">Decision</option>
            <option value="match_gate">Match Gate</option>
            <option value="policy_gate">Policy Gate</option>
            <option value="ats_gate">ATS Gate</option>
            <option value="apply">Apply</option>
          </select>
        </FilterBar>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No automation events yet.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const state = getEventState(event);
              const label = getEventLabel(event);
              return (
                <div
                  key={event.id}
                  className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {(event.company || 'Unknown Company')} | {(event.role || 'Unknown Role')}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {event.source} | {event.stage}
                      </p>
                    </div>
                    <StatusPill state={state} label={label} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                    {typeof event.ats_score === 'number' && <span>ATS {event.ats_score}</span>}
                    {typeof event.passes_gate === 'boolean' && (
                      <span>Gate {event.passes_gate ? 'Pass' : 'Fail'}</span>
                    )}
                    {event.override_used && <span>Override Yes</span>}
                    <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      {timeAgo(event.created_at)}
                    </span>
                  </div>

                  {event.reason && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {event.reason}
                    </p>
                  )}

                  <div className="mt-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
                      onClick={() => setExpandedEventId((prev) => (prev === event.id ? null : event.id))}
                    >
                      {expandedEventId === event.id ? 'Hide details' : 'View details'}
                    </button>
                  </div>

                  {expandedEventId === event.id && (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                        Event details
                      </p>
                      <dl className="mt-1 grid grid-cols-1 gap-1 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold">Source</dt>
                          <dd>{event.source}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Stage</dt>
                          <dd>{event.stage}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Action</dt>
                          <dd>{event.action}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Created</dt>
                          <dd>{new Date(event.created_at).toLocaleString()}</dd>
                        </div>
                      </dl>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <pre className="mt-2 max-h-40 overflow-auto rounded bg-white p-2 text-[11px] text-gray-700 dark:bg-gray-950 dark:text-gray-200">
{JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {events.length >= limit && (
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

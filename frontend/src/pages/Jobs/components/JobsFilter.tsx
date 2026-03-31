import { Search, ListFilter, Plus } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Status: All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Applied', value: 'applied' },
  { label: 'Interviewing', value: 'interviewing' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Offered', value: 'offered' },
  { label: 'Failed', value: 'failed' },
];

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Sort: Newest', value: '' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Title', value: 'title' },
  { label: 'Company', value: 'company' },
];

interface JobsFilterProps {
  onSearch: (query: string) => void;
  onStatusChange: (status: string) => void;
  onSortChange: (sort: string) => void;
  onNewApplication?: () => void;
}

export function JobsFilter({ onSearch, onStatusChange, onSortChange, onNewApplication }: JobsFilterProps) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/70 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-600 dark:text-gray-300">
          Filter Applications
        </h2>
        <Button variant="primary" onClick={onNewApplication} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Application
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by role or company"
            className="h-11 rounded-xl border-gray-300 bg-white pl-9 dark:border-gray-700 dark:bg-gray-900"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            aria-label="Filter by status"
            className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ListFilter className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />
        </div>

        <div className="relative">
          <select
            aria-label="Sort jobs"
            className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            onChange={(e) => onSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

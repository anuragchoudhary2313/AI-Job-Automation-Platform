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
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Filter jobs..."
          className="pl-9 bg-white dark:bg-gray-950"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <div className="relative">
          <select
            aria-label="Filter by status"
            className="h-10 w-[150px] appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ListFilter className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            aria-label="Sort jobs"
            className="h-10 w-[150px] appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
            onChange={(e) => onSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" onClick={onNewApplication} className="gap-1">
          <Plus className="h-4 w-4" />
          New Application
        </Button>
      </div>
    </div>
  );
}

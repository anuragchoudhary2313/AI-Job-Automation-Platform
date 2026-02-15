import { useState } from 'react';
import { JobsFilter } from './components/JobsFilter';
import { JobsTable } from './components/JobsTable';
import { JobScraper } from './components/JobScraper';
import { useDebounce } from '../../hooks/useDebounce';

export function Jobs() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  const filters = {
    search: debouncedSearch,
    status,
    sort
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Jobs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track your applications.</p>
        </div>
      </div>

      {/* Job Scraper Section */}
      <JobScraper />

      <JobsFilter
        onSearch={setSearch}
        onStatusChange={setStatus}
        onSortChange={setSort}
      />
      <JobsTable filters={filters} />
    </div>
  );
}

export default Jobs;

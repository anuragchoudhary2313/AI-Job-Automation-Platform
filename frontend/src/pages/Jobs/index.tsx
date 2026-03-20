import { useState, useRef } from 'react';
import { JobsFilter } from './components/JobsFilter';
import { JobsTable } from './components/JobsTable';
import { JobScraper } from './components/JobScraper';
import { ScrapedJobsList } from './components/ScrapedJobsList';
import { useDebounce } from '../../hooks/useDebounce';
import { useFeatures } from '../../contexts/FeatureContext';

export function Jobs() {
  const { isEnabled } = useFeatures();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('');
  const scraperRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 500);

  const filters = {
    search: debouncedSearch,
    status,
    sort
  };

  const scrollToScraper = () => {
    scraperRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      {isEnabled('job_scraping') && (
        <div ref={scraperRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JobScraper />
          <ScrapedJobsList />
        </div>
      )}

      <JobsFilter
        onSearch={setSearch}
        onStatusChange={setStatus}
        onSortChange={setSort}
        onNewApplication={scrollToScraper}
      />
      <JobsTable filters={filters} onStartScan={scrollToScraper} />
    </div>
  );
}

export default Jobs;

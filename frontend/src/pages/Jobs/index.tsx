import { useState, useRef } from 'react';
import { Briefcase, Radar } from 'lucide-react';
import { JobsFilter } from './components/JobsFilter';
import { JobsTable } from './components/JobsTable';
import { JobScraper } from './components/JobScraper';
import { ScrapedJobsList } from './components/ScrapedJobsList';
import { useDebounce } from '../../hooks/useDebounce';
import { useFeatures } from '../../contexts/FeatureContext';

export function Jobs() {
  const { isEnabled } = useFeatures();
  const [activeView, setActiveView] = useState<'discover' | 'scraped' | 'applications'>(
    isEnabled('job_scraping') ? 'discover' : 'applications'
  );
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
    setActiveView('discover');
    scraperRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToApplications = () => {
    setActiveView('applications');
  };

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-amber-50 px-6 py-7 shadow-sm dark:border-sky-900/60 dark:from-sky-950/40 dark:via-gray-950 dark:to-amber-950/20">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-600/20" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/15" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-800 dark:bg-gray-900/70 dark:text-sky-300">
              <Briefcase className="h-3.5 w-3.5" />
              Application Hub
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">
              Jobs Pipeline
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300 md:text-base">
              Track every opportunity from discovery to offer and keep your search flow focused.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <div className="rounded-2xl border border-sky-200 bg-white/90 px-4 py-3 dark:border-sky-900/70 dark:bg-gray-900/80">
              <p className="text-[11px] uppercase tracking-widest text-sky-700 dark:text-sky-300">Search</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {debouncedSearch ? `"${debouncedSearch}"` : 'All roles'}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 dark:border-amber-900/70 dark:bg-gray-900/80">
              <p className="text-[11px] uppercase tracking-widest text-amber-700 dark:text-amber-300">View</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {status || 'All statuses'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {isEnabled('job_scraping') && (
        <section className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveView('discover')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeView === 'discover'
                  ? 'bg-sky-600 text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900'
              }`}
            >
              Discover Jobs
            </button>
            <button
              type="button"
              onClick={() => setActiveView('scraped')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeView === 'scraped'
                  ? 'bg-sky-600 text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900'
              }`}
            >
              Scraped (7 Days)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('applications')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeView === 'applications'
                  ? 'bg-sky-600 text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900'
              }`}
            >
              Saved Applications
            </button>
          </div>
        </section>
      )}

      {/* Job Scraper Section */}
      {isEnabled('job_scraping') && activeView === 'discover' && (
        <section ref={scraperRef} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            <Radar className="h-4 w-4" />
            Job Discovery
          </div>
          <div ref={scraperRef} className="grid grid-cols-1 gap-6">
            <JobScraper
              onScrapeTriggered={() => setActiveView('discover')}
              onScrapeSuccess={() => setActiveView('scraped')}
            />
          </div>
        </section>
      )}

      {isEnabled('job_scraping') && activeView === 'scraped' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            <Radar className="h-4 w-4" />
            Scraped Jobs Window (7 Days)
          </div>
          <ScrapedJobsList onApply={() => goToApplications()} />
        </section>
      )}

      {activeView === 'applications' && (
        <>
          <JobsFilter
            onSearch={setSearch}
            onStatusChange={setStatus}
            onSortChange={setSort}
            onNewApplication={scrollToScraper}
          />

          <JobsTable filters={filters} onStartScan={scrollToScraper} />
        </>
      )}
    </div>
  );
}

export default Jobs;

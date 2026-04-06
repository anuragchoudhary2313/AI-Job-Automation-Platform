import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
      <Link
        to="/"
        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-gray-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-cyan-900/60 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-300"
        title="Dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>

      {pathnames.length === 0 && (
        <span className="ml-2 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-900/20 dark:text-cyan-300">
          Dashboard
        </span>
      )}

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        const formattedName = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

        return (
          <div key={to} className="flex items-center">
            <ChevronRight className="mx-1.5 h-3.5 w-3.5 text-gray-400 dark:text-gray-600" />
            {isLast ? (
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-900/20 dark:text-cyan-300">
                {formattedName}
              </span>
            ) : (
              <Link
                to={to}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-cyan-900/60 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-300"
              >
                {formattedName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

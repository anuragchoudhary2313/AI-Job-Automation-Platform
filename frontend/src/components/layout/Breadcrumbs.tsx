import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
      <Link
        to="/"
        className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center"
        title="Dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        const formattedName = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

        return (
          <div key={to} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {formattedName}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
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

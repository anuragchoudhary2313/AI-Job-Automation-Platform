import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

/**
 * Generic error page component
 */
export function ErrorPage({
  title = 'Something went wrong',
  message = 'We encountered an error while processing your request.',
  onRetry,
  showHomeButton = true,
}: ErrorPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h1>

      <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md">
        {message}
      </p>

      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}

        {showHomeButton && (
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 404 Not Found page
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-4">
      <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800 mb-4">
        404
      </h1>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Page not found
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        <Home className="w-4 h-4 mr-2" />
        Back to Home
      </button>
    </div>
  );
}

/**
 * Loading state with error fallback
 */
export function LoadingWithError({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorPage message={error} onRetry={onRetry} />;
  }

  return <>{children}</>;
}

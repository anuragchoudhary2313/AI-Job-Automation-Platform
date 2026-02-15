import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Network status hook to detect online/offline state
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Offline banner component
 */
export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else {
      // Delay hiding banner to show "Back online" message
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-white transition-colors ${isOnline ? 'bg-green-600' : 'bg-red-600'
        }`}
      role="alert"
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline && <WifiOff className="w-5 h-5" />}
        <span className="font-medium">
          {isOnline ? '✓ Back online' : 'No internet connection'}
        </span>
      </div>
    </div>
  );
}

/**
 * Offline fallback component for pages
 */
export function OfflineFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <WifiOff className="w-8 h-8 text-gray-600 dark:text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        You're offline
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        Please check your internet connection and try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
}

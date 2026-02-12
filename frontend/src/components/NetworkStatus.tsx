import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import clsx from 'clsx';

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      // Hide "restored" message after 3 seconds
      setTimeout(() => setShowRestored(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Online and not showing restored message
  if (isOnline && !showRestored) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Connection restored</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>You are offline. Changes may not be saved.</span>
        </>
      )}
    </div>
  );
}

// Hook for components to check network status
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

  return { isOnline };
}

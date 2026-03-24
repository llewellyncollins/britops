import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSyncContext } from '../../context/SyncContext';

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const { syncing } = useSyncContext();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={!online ? 'Offline' : syncing ? 'Syncing' : 'Online'}
      className="flex items-center gap-1.5 text-sm"
    >
      {!online ? (
        <>
          <WifiOff aria-hidden="true" size={16} className="text-amber-300" />
          <span className="text-amber-200 text-xs">Offline</span>
        </>
      ) : (
        <>
          <Wifi aria-hidden="true" size={16} className="text-emerald-300" />
          {syncing && <RefreshCw aria-hidden="true" size={13} className="text-emerald-300 animate-spin" />}
        </>
      )}
    </div>
  );
}

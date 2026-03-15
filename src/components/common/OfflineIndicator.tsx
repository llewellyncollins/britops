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

  if (!online) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <WifiOff size={16} className="text-yellow-300" />
        <span className="text-yellow-200 text-xs">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Wifi size={16} className="text-green-300" />
      {syncing && (
        <RefreshCw size={13} className="text-green-300 animate-spin" />
      )}
    </div>
  );
}

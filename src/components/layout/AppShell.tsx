import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from '../common/OfflineIndicator';

export function AppShell() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="bg-primary text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-bold tracking-tight">BritOps</h1>
        <OfflineIndicator />
      </header>
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

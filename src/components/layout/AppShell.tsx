import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from '../common/OfflineIndicator';

export function AppShell() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      <header className="bg-primary text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <img src="/theatrelog-no-tagline-dark.svg" alt="Theatrelog" className="h-7" />
        <OfflineIndicator />
      </header>
      <main id="main-content" className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import { ClipboardList, PlusCircle, BarChart3, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS: { to: string; icon: typeof ClipboardList; label: string }[] = [
  { to: '/', icon: ClipboardList, label: 'Logbook' },
  { to: '/log', icon: PlusCircle, label: 'Log Op' },
  { to: '/portfolio', icon: BarChart3, label: 'Portfolio' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 bg-surface-raised border-t border-border flex justify-around py-2 z-50">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 text-xs rounded-lg transition-colors min-h-11 min-w-11 justify-center',
              isActive ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'
            )
          }
        >
          <Icon aria-hidden="true" size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

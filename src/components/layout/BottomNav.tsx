import { NavLink } from 'react-router-dom';
import { ClipboardList, PlusCircle, BarChart3, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/', icon: ClipboardList, label: 'Logbook' },
  { to: '/log', icon: PlusCircle, label: 'Log Op' },
  { to: '/portfolio', icon: BarChart3, label: 'Portfolio' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-raised border-t border-border flex justify-around py-2 z-50">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 text-xs rounded-lg transition-colors',
              isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text'
            )
          }
        >
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

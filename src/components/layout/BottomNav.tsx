import { NavLink } from 'react-router-dom';
import { ClipboardList, PlusCircle, BarChart3, Settings, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTier } from '../../hooks/useTier';
import type { GatedFeature } from '../../types';

const NAV_ITEMS: { to: string; icon: typeof ClipboardList; label: string; gatedFeature?: GatedFeature }[] = [
  { to: '/', icon: ClipboardList, label: 'Logbook' },
  { to: '/log', icon: PlusCircle, label: 'Log Op' },
  { to: '/portfolio', icon: BarChart3, label: 'Portfolio', gatedFeature: 'portfolio' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const { can } = useTier();

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 bg-surface-raised border-t border-border flex justify-around py-2 z-50">
      {NAV_ITEMS.map(({ to, icon: Icon, label, gatedFeature }) => {
        const isLocked = gatedFeature && !can(gatedFeature);
        return (
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
            <span className="relative">
              <Icon aria-hidden="true" size={22} />
              {isLocked && (
                <span className="absolute -top-1 -right-2.5 bg-accent text-white rounded-full p-0.5" aria-label="Pro feature">
                  <Lock aria-hidden="true" size={8} />
                </span>
              )}
            </span>
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}

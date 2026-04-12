import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTier } from '../../hooks/useTier';
import { trackUpgradePrompted } from '../../firebase/analytics';
import type { GatedFeature } from '../../types';

interface LockedFeatureProps {
  feature: GatedFeature;
  children: ReactNode;
  className?: string;
}

export function LockedFeature({ feature, children, className }: LockedFeatureProps) {
  const { can, requiredTier } = useTier();
  const navigate = useNavigate();

  if (can(feature)) {
    return <>{children}</>;
  }

  const required = requiredTier(feature);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackUpgradePrompted({ source: feature, required_tier: required });

    if (required === 'signed-in') {
      navigate(`/login?returnTo=${window.location.pathname}`);
    } else {
      navigate('/upgrade');
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e as unknown as React.MouseEvent); }}
      className={cn('relative cursor-pointer group', className)}
      aria-label={`Upgrade to ${required === 'paid' ? 'Pro' : 'sign in'} to unlock this feature`}
    >
      <div className="opacity-40 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 text-white text-xs font-medium shadow-sm group-hover:bg-primary transition-colors">
          <Lock aria-hidden="true" size={12} />
          {required === 'paid' ? 'Pro' : 'Sign in'}
        </span>
      </div>
    </div>
  );
}

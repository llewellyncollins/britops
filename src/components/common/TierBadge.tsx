import { cn } from '../../lib/utils';
import type { UserTier } from '../../types';

const TIER_CONFIG: Record<UserTier, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  'signed-in': { label: 'Signed In', className: 'bg-primary text-white dark:bg-blue-800 dark:text-blue-100' },
  paid: { label: 'Pro', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

interface TierBadgeProps {
  tier: UserTier;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const { label, className: badgeClass } = TIER_CONFIG[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        badgeClass,
        className,
      )}
    >
      {label}
    </span>
  );
}

import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { trackUpgradePrompted } from '../../firebase/analytics';

interface UpgradeBannerProps {
  title?: string;
  description?: string;
  feature?: string;
  className?: string;
}

export function UpgradeBanner({
  title = 'Unlock with Theatrelog Pro',
  description = 'Get cloud sync, ARCP-ready exports, and full portfolio analytics.',
  feature = 'general',
  className,
}: UpgradeBannerProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    trackUpgradePrompted({ source: feature, required_tier: 'paid' });
    navigate('/upgrade');
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/30',
        className,
      )}
    >
      <Sparkles aria-hidden="true" size={28} className="mx-auto mb-3 text-accent" />
      <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-4">{description}</p>
      <button
        type="button"
        onClick={handleUpgrade}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-amber-500 transition-colors"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

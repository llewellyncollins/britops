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
        'rounded-xl border border-amber-300/50 bg-linear-to-br from-amber-50 via-white to-amber-50 p-6 text-center shadow-sm dark:border-amber-800 dark:bg-linear-to-br dark:from-amber-950/30 dark:via-transparent dark:to-amber-950/30',
        className,
      )}
    >
      <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
        <Sparkles aria-hidden="true" size={20} className="text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-heading mb-1">{title}</h3>
      <p className="text-sm text-text mb-5">{description}</p>
      <button
        type="button"
        onClick={handleUpgrade}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white font-medium text-sm shadow-md shadow-amber-200/50 hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-200/50 transition-all dark:shadow-none"
      >
        <Sparkles aria-hidden="true" size={14} />
        Upgrade to Pro
      </button>
    </div>
  );
}

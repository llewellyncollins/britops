import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTier } from '../hooks/useTier';
import {
  getProProduct,
  createCheckoutSession,
  createPortalSession,
  type StripePrice,
} from '../firebase/stripe';
import { TierBadge } from '../components/common/TierBadge';
import {
  trackUpgradePageViewed,
  trackCheckoutStarted,
} from '../firebase/analytics';

function formatPrice(price: StripePrice): string {
  const amount = (price.unit_amount / 100).toFixed(2);
  const symbol = price.currency === 'gbp' ? '£' : price.currency === 'usd' ? '$' : price.currency.toUpperCase() + ' ';
  return `${symbol}${amount}`;
}

const TIER_FEATURES = [
  { label: 'Log operations offline', free: true, signedIn: true, pro: true },
  { label: 'Set specialty', free: false, signedIn: true, pro: true },
  { label: 'Import from Excel', free: false, signedIn: true, pro: true },
  { label: 'Report bugs & request features', free: false, signedIn: true, pro: true },
  { label: 'Cloud sync across devices', free: false, signedIn: false, pro: true },
  { label: 'Set trainee grade', free: false, signedIn: false, pro: true },
  { label: 'Custom procedures', free: false, signedIn: false, pro: true },
  { label: 'Export (CSV, Excel, JSON)', free: false, signedIn: false, pro: true },
  { label: 'Portfolio analytics & ARCP summaries', free: false, signedIn: false, pro: true },
];

export function UpgradePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useTier();
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('year');
  const [error, setError] = useState('');

  useEffect(() => {
    trackUpgradePageViewed();
    getProProduct()
      .then(product => {
        if (product) {
          setPrices(product.prices);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedPrice = prices.find(p => p.interval === billingPeriod);
  const monthlyPrice = prices.find(p => p.interval === 'month');
  const annualPrice = prices.find(p => p.interval === 'year');

  async function handleCheckout() {
    if (!user) {
      navigate('/login?returnTo=/upgrade');
      return;
    }
    if (!selectedPrice) return;

    setCheckoutLoading(true);
    setError('');
    try {
      trackCheckoutStarted({ plan: billingPeriod === 'month' ? 'monthly' : 'annual' });
      const url = await createCheckoutSession(user, selectedPrice.id);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckoutLoading(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const url = await createPortalSession();
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open portal');
      setPortalLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <Sparkles aria-hidden="true" size={32} className="mx-auto mb-2 text-accent" />
        <h1 className="text-2xl font-bold text-heading">Theatrelog Pro</h1>
        <p className="text-text-muted text-sm mt-1">Your logbook, sorted — with cloud sync and ARCP-ready exports.</p>
      </div>

      {/* Current tier */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-text-muted">Your plan:</span>
        <TierBadge tier={tier} />
      </div>

      {/* If already Pro, show manage subscription */}
      {tier === 'paid' ? (
        <div className="text-center space-y-4">
          <p className="text-success font-medium">You have full access to all features.</p>
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:border-accent transition-colors"
          >
            {portalLoading ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : <ExternalLink aria-hidden="true" size={16} />}
            Manage subscription
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      ) : (
        <>
          {/* Pricing toggle */}
          {!loading && prices.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1 bg-surface-raised rounded-lg p-1">
                <button
                  onClick={() => setBillingPeriod('month')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingPeriod === 'month'
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Monthly
                  {monthlyPrice && <span className="block text-xs opacity-80">{formatPrice(monthlyPrice)}/mo</span>}
                </button>
                <button
                  onClick={() => setBillingPeriod('year')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingPeriod === 'year'
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Annual
                  {annualPrice && <span className="block text-xs opacity-80">{formatPrice(annualPrice)}/yr</span>}
                  {monthlyPrice && annualPrice && (
                    <span className="block text-xs text-accent font-medium">
                      Save {Math.round((1 - annualPrice.unit_amount / (monthlyPrice.unit_amount * 12)) * 100)}%
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || !selectedPrice}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent text-white font-semibold text-base hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <Loader2 aria-hidden="true" size={18} className="animate-spin" />
                ) : (
                  <Sparkles aria-hidden="true" size={18} />
                )}
                {checkoutLoading ? 'Redirecting to checkout...' : user ? 'Upgrade to Pro' : 'Sign in to upgrade'}
              </button>

              <p className="text-xs text-text-muted text-center">
                Promotion codes can be applied at checkout. Cancel anytime.
              </p>

              {error && <p className="text-sm text-danger text-center">{error}</p>}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 aria-hidden="true" size={24} className="text-accent animate-spin" />
            </div>
          )}

          {!loading && prices.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              Pricing is being set up. Check back soon.
            </p>
          )}
        </>
      )}

      {/* Feature comparison */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 bg-primary text-white text-xs font-semibold">
          <div className="p-2.5">Feature</div>
          <div className="p-2.5 text-center">Free</div>
          <div className="p-2.5 text-center">Signed In</div>
          <div className="p-2.5 text-center">Pro</div>
        </div>
        {TIER_FEATURES.map(({ label, free, signedIn, pro }) => (
          <div key={label} className="grid grid-cols-4 border-t border-border text-sm">
            <div className="p-2.5 text-text">{label}</div>
            <div className="p-2.5 flex justify-center">
              {free ? <Check aria-label="Included" size={16} className="text-success" /> : <span className="text-text-muted" aria-label="Not included">—</span>}
            </div>
            <div className="p-2.5 flex justify-center">
              {signedIn ? <Check aria-label="Included" size={16} className="text-success" /> : <span className="text-text-muted" aria-label="Not included">—</span>}
            </div>
            <div className="p-2.5 flex justify-center">
              {pro ? <Check aria-label="Included" size={16} className="text-accent" /> : <span className="text-text-muted" aria-label="Not included">—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import type { UserTier, GatedFeature } from '../types';

const TIER_RANK: Record<UserTier, number> = {
  free: 0,
  'signed-in': 1,
  paid: 2,
};

const FEATURE_MIN_TIER: Record<GatedFeature, UserTier> = {
  // Signed-in tier
  import: 'signed-in',
  support: 'signed-in',
  specialtySetting: 'signed-in',
  // Paid tier
  sync: 'paid',
  exportCsv: 'paid',
  exportXlsx: 'paid',
  exportJson: 'paid',
  portfolio: 'paid',
  gradeSetting: 'paid',
  customProcedures: 'paid',
};

export function useTier() {
  const { user, loading: authLoading } = useAuth();
  const [stripeRole, setStripeRole] = useState<string | null>(null);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  // Fetch custom claims from the auth token
  const refreshClaims = useCallback(async (forceRefresh = false) => {
    const u = userRef.current;
    if (!u) {
      setStripeRole(null);
      return;
    }
    try {
      setClaimsLoading(true);
      const result = await u.getIdTokenResult(forceRefresh);
      setStripeRole((result.claims.stripeRole as string) ?? null);
    } catch {
      // Token refresh failed (e.g. offline) — keep last known value
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  // Refresh claims when user changes
  useEffect(() => {
    if (user) {
      refreshClaims(false);
    } else {
      setStripeRole(null);
    }
  }, [user, refreshClaims]);

  // Force-refresh claims whenever the app comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (userRef.current) {
        refreshClaims(true);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refreshClaims]);

  const tier: UserTier = !user
    ? 'free'
    : stripeRole === 'pro'
      ? 'paid'
      : 'signed-in';

  const can = useCallback(
    (feature: GatedFeature): boolean => {
      return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
    },
    [tier],
  );

  const requiredTier = useCallback((feature: GatedFeature): UserTier => {
    return FEATURE_MIN_TIER[feature];
  }, []);

  return {
    tier,
    can,
    requiredTier,
    loading: authLoading || claimsLoading,
    refreshClaims,
  };
}

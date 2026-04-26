import { useCallback } from 'react';
import { useAuth } from './useAuth';
import type { UserTier, GatedFeature } from '../types';


export function useTier() {
  const { user, loading } = useAuth();

  const tier: UserTier = user ? 'signed-in' : 'free';

  const can = useCallback(
    (_feature: GatedFeature): boolean => {
      return !!user;
    },
    [user],
  );

  const requiredTier = useCallback((_feature: GatedFeature): UserTier => {
    return 'signed-in';
  }, []);

  return { tier, can, requiredTier, loading };
}

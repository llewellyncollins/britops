import { useCallback } from "react";
import { useAuth } from "./useAuth";
import type { UserTier } from "../types";

export function useTier() {
  const { user, loading } = useAuth();

  const tier: UserTier = user ? "signed-in" : "free";

  const can = useCallback((): boolean => {
    return !!user;
  }, [user]);

  const requiredTier = useCallback((): UserTier => {
    return "signed-in";
  }, []);

  return { tier, can, requiredTier, loading };
}

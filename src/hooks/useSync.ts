import { useEffect, useRef, useState } from 'react';
import { type User } from 'firebase/auth';
import { isConfigured } from '../firebase/config';
import {
  subscribeToFirestore,
  syncFromFirestore,
  pushToFirestore,
  isSyncingFromFirestore,
  migrateLocalOps,
  pushProcedureTypeToFirestore,
  deleteProcedureTypeFromFirestore,
  subscribeToProcedureTypes,
  syncProcedureTypesFromFirestore,
  pushUserSettingsToFirestore,
  subscribeToUserSettings,
} from '../firebase/firestore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { db } from '../db/dexie';
import type { OperationEntry, ProcedureType, UserTier } from '../types';

export function useSync(user: User | null, tier: UserTier = 'free') {
  const [syncing, setSyncing] = useState(false);

  // Refs so Dexie hooks can read the latest values without re-registering
  const userRef = useRef<User | null>(null);
  const prevUserRef = useRef<User | null>(null);
  const tierRef = useRef<UserTier>(tier);
  const prevTierRef = useRef<UserTier>(tier);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep refs current
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    prevTierRef.current = tierRef.current;
    tierRef.current = tier;
  }, [tier]);

  // ── Effect 1: Register Dexie hooks ONCE at mount ─────────────────────────
  // Hooks are registered globally on the Dexie db; they read userRef/tierRef at
  // execution time so they never need to be re-registered on auth changes.
  useEffect(() => {
    function schedule(fn: () => Promise<void>) {
      const id = setTimeout(() => { fn().catch(console.error); }, 0);
      timeoutIds.current.push(id);
    }

    async function markSyncedIfUnchanged(id: string, pushedUpdatedAt: string) {
      const current = await db.operations.get(id);
      if (current && current.updatedAt === pushedUpdatedAt) {
        await db.operations.update(id, { syncPending: false });
      }
    }

    const opsCreating = function (_primKey: unknown, obj: OperationEntry) {
      if (!userRef.current) { console.warn('[sync] opsCreating skipped — no user'); return; }
      if (!isConfigured) { console.warn('[sync] opsCreating skipped — Firebase not configured'); return; }
      if (tierRef.current !== 'paid') { console.log('[sync] opsCreating skipped — not Pro tier'); return; }
      if (isSyncingFromFirestore) return;
      if (!navigator.onLine) { console.log('[sync] opsCreating queued (offline):', obj.id); return; }
      schedule(async () => {
        try {
          await pushToFirestore(obj);
          await markSyncedIfUnchanged(obj.id, obj.updatedAt);
        } catch (err) {
          console.error('[sync] Push failed, will retry on reconnect:', err);
        }
      });
    };

    const opsUpdating = function (
      modifications: Partial<OperationEntry>,
      _primKey: unknown,
      obj: OperationEntry,
    ) {
      if (!userRef.current || !isConfigured || isSyncingFromFirestore) return;
      if (tierRef.current !== 'paid') return;
      if (modifications.syncPending === false) return;
      if (!navigator.onLine) return;
      const pushed = { ...obj, ...modifications } as OperationEntry;
      schedule(async () => {
        try {
          await pushToFirestore(pushed);
          await markSyncedIfUnchanged(pushed.id, pushed.updatedAt);
        } catch (err) {
          console.error('[sync] Push failed, will retry on reconnect:', err);
        }
      });
    };

    const ptCreating = function (_primKey: unknown, obj: ProcedureType) {
      if (!userRef.current || !isConfigured || !obj.isCustom) return;
      if (tierRef.current !== 'paid') return;
      const uid = userRef.current.uid;
      schedule(async () => {
        await pushProcedureTypeToFirestore(uid, obj);
      });
    };

    const ptDeleting = function (primKey: string) {
      if (!userRef.current || !isConfigured) return;
      if (tierRef.current !== 'paid') return;
      const uid = userRef.current.uid;
      schedule(async () => {
        await deleteProcedureTypeFromFirestore(uid, primKey);
      });
    };

    db.operations.hook('creating', opsCreating);
    db.operations.hook('updating', opsUpdating);
    db.procedureTypes.hook('creating', ptCreating);
    db.procedureTypes.hook('deleting', ptDeleting);

    return () => {
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
      db.operations.hook('creating').unsubscribe(opsCreating);
      db.operations.hook('updating').unsubscribe(opsUpdating);
      db.procedureTypes.hook('creating').unsubscribe(ptCreating);
      db.procedureTypes.hook('deleting').unsubscribe(ptDeleting);
    };
  }, []); // mount only

  // ── Effect 2: Migrate pre-login data on first sign-in, then push pending ──
  useEffect(() => {
    if (user && !prevUserRef.current) {
      // null → signed in: claim any 'local-user' operations
      migrateLocalOps(user.uid)
        .then(() => {
          // Only push to Firestore if paid
          if (tierRef.current === 'paid') {
            return pushPendingOps(user.uid);
          }
        })
        .catch(console.error);
    }
    prevUserRef.current = user;
  }, [user]);

  // ── Effect 3: Firestore real-time subscriptions ───────────────────────────
  useEffect(() => {
    if (!user || !isConfigured) return;

    // Operations & procedure types listeners only for paid tier
    let unsubOps: (() => void) | undefined;
    let unsubTypes: (() => void) | undefined;

    if (tier === 'paid') {
      unsubOps = subscribeToFirestore(user.uid, async remoteEntries => {
        setSyncing(true);
        await syncFromFirestore(remoteEntries);
        setSyncing(false);
      });

      unsubTypes = subscribeToProcedureTypes(user.uid, async remoteTypes => {
        await syncProcedureTypesFromFirestore(remoteTypes);
      });
    }

    // Settings listener active for all signed-in users (receives subscription updates too)
    const unsubSettings = subscribeToUserSettings(user.uid, (remoteSettings) => {
      useSettingsStore.getState().setSettings(remoteSettings);
    });

    return () => {
      unsubOps?.();
      unsubTypes?.();
      unsubSettings();
    };
  }, [user, tier]);

  // ── Effect 4: Push settings changes to Firestore ──────────────────────────
  useEffect(() => {
    if (!user || !isConfigured) return;

    const unsub = useSettingsStore.subscribe((state) => {
      const currentTier = tierRef.current;
      // Push specialty for all signed-in users; grade only for paid
      const settings = currentTier === 'paid'
        ? { specialty: state.specialty, grade: state.grade }
        : { specialty: state.specialty };
      pushUserSettingsToFirestore(user.uid, settings).catch(console.error);
    });

    // Push current settings on first sign-in
    const { specialty, grade } = useSettingsStore.getState();
    const settings = tier === 'paid'
      ? { specialty, grade }
      : { specialty };
    pushUserSettingsToFirestore(user.uid, settings).catch(console.error);

    return unsub;
  }, [user, tier]);

  // ── Effect 5: Push pending operations when connectivity is restored ───────
  useEffect(() => {
    const handleOnline = () => {
      const uid = userRef.current?.uid;
      if (!uid || !isConfigured) return;
      if (tierRef.current !== 'paid') return;
      pushPendingOps(uid).catch(console.error);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []); // mount only

  // ── Effect 6: Flush queued ops when user upgrades to paid ─────────────────
  useEffect(() => {
    if (tier === 'paid' && prevTierRef.current !== 'paid' && user) {
      pushPendingOps(user.uid).catch(console.error);
    }
  }, [tier, user]);

  return { syncing };
}

/**
 * Push all operations for a user that have `syncPending: true`.
 * Exported for use by Effects 2, 5, 6 as well as tests.
 */
export async function pushPendingOps(userId: string): Promise<void> {
  const all = await db.operations.where('userId').equals(userId).toArray();
  const pending = all.filter(op => op.syncPending);
  for (const op of pending) {
    try {
      await pushToFirestore(op);
      const current = await db.operations.get(op.id);
      if (current && current.updatedAt === op.updatedAt) {
        await db.operations.update(op.id, { syncPending: false });
      }
    } catch (err) {
      console.error('[sync] Pending push failed for op:', op.id, err);
    }
  }
}

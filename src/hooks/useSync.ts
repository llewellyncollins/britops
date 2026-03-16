import { useEffect, useRef, useState } from 'react';
import { type User } from 'firebase/auth';
import { isConfigured } from '../firebase/config';
import {
  subscribeToFirestore,
  syncFromFirestore,
  pushToFirestore,
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
import type { OperationEntry, ProcedureType } from '../types';

export function useSync(user: User | null) {
  const [syncing, setSyncing] = useState(false);

  // Refs so Dexie hooks can read the latest user without re-registering
  const userRef = useRef<User | null>(null);
  const prevUserRef = useRef<User | null>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep userRef current with latest prop value
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ── Effect 1: Register Dexie hooks ONCE at mount ─────────────────────────
  // Hooks are registered globally on the Dexie db; they read userRef at
  // execution time so they never need to be re-registered on auth changes.
  useEffect(() => {
    function schedule(fn: () => void) {
      const id = setTimeout(fn, 0);
      timeoutIds.current.push(id);
    }

    const opsCreating = function (_primKey: unknown, obj: OperationEntry) {
      if (!userRef.current || !isConfigured) return;
      schedule(() => pushToFirestore(obj));
    };

    const opsUpdating = function (
      modifications: Partial<OperationEntry>,
      _primKey: unknown,
      obj: OperationEntry,
    ) {
      if (!userRef.current || !isConfigured) return;
      schedule(() => pushToFirestore({ ...obj, ...modifications }));
    };

    const ptCreating = function (_primKey: unknown, obj: ProcedureType) {
      if (!userRef.current || !isConfigured || !obj.isCustom) return;
      const uid = userRef.current.uid;
      schedule(() => pushProcedureTypeToFirestore(uid, obj));
    };

    const ptDeleting = function (primKey: string) {
      if (!userRef.current || !isConfigured) return;
      const uid = userRef.current.uid;
      schedule(() => deleteProcedureTypeFromFirestore(uid, primKey));
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

  // ── Effect 2: Migrate pre-login data on first sign-in ────────────────────
  useEffect(() => {
    if (user && !prevUserRef.current) {
      // null → signed in: claim any 'local-user' operations
      migrateLocalOps(user.uid).catch(console.error);
    }
    prevUserRef.current = user;
  }, [user]);

  // ── Effect 3: Firestore real-time subscriptions ───────────────────────────
  useEffect(() => {
    if (!user || !isConfigured) return;

    const unsubOps = subscribeToFirestore(user.uid, async remoteEntries => {
      setSyncing(true);
      await syncFromFirestore(remoteEntries);
      setSyncing(false);
    });

    const unsubTypes = subscribeToProcedureTypes(user.uid, async remoteTypes => {
      await syncProcedureTypesFromFirestore(remoteTypes);
    });

    const unsubSettings = subscribeToUserSettings(user.uid, (remoteSettings) => {
      useSettingsStore.getState().setSettings(remoteSettings);
    });

    return () => {
      unsubOps();
      unsubTypes();
      unsubSettings();
    };
  }, [user]);

  // ── Effect 4: Push settings changes to Firestore ───────────────────────────
  useEffect(() => {
    if (!user || !isConfigured) return;

    const unsub = useSettingsStore.subscribe((state) => {
      const { specialty } = state;
      pushUserSettingsToFirestore(user.uid, { specialty }).catch(console.error);
    });

    // Push current settings on first sign-in
    const { specialty } = useSettingsStore.getState();
    pushUserSettingsToFirestore(user.uid, { specialty }).catch(console.error);

    return unsub;
  }, [user]);

  return { syncing };
}

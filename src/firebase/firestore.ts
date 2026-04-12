import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore, isConfigured } from './config';
import { db } from '../db/dexie';
import type { OperationEntry, ProcedureType, ConsentRecord } from '../types';
import type { UserSettings } from '../stores/useSettingsStore';

// ─── Operations ────────────────────────────────────────────────────────────────

const OPS_COLLECTION = 'operations';

/**
 * Flag set to true while syncFromFirestore is writing to Dexie.
 * Dexie hooks read this to avoid re-pushing data that originated from Firestore.
 */
export let isSyncingFromFirestore = false;

export async function pushToFirestore(entry: OperationEntry) {
  if (!firestore || !isConfigured) {
    console.warn('[sync] pushToFirestore skipped — Firebase not initialised. isConfigured:', isConfigured, 'firestore:', !!firestore);
    return;
  }
  // Strip the local-only syncPending field before writing to Firestore
  const data: Omit<OperationEntry, 'syncPending'> & { syncPending?: boolean } = { ...entry };
  delete data.syncPending;
  const ref = doc(firestore, OPS_COLLECTION, entry.id);
  console.log('[sync] pushToFirestore →', entry.id, '(userId:', entry.userId, ')');
  await setDoc(ref, data, { merge: true });
  console.log('[sync] pushToFirestore ✓', entry.id);
}

export async function pushAllToFirestore(userId: string) {
  if (!firestore || !isConfigured) return;
  const entries = await db.operations.toArray();
  const userEntries = entries.filter(e => e.userId === userId);
  for (const entry of userEntries) {
    await pushToFirestore(entry);
  }
}

export function subscribeToFirestore(
  userId: string,
  onUpdate: (entries: OperationEntry[]) => void,
): Unsubscribe {
  if (!firestore || !isConfigured) return () => {};

  const q = query(
    collection(firestore, OPS_COLLECTION),
    where('userId', '==', userId),
  );

  return onSnapshot(q, snapshot => {
    const entries: OperationEntry[] = [];
    snapshot.forEach(d => entries.push(d.data() as OperationEntry));
    onUpdate(entries);
  });
}

export async function syncFromFirestore(remoteEntries: OperationEntry[]) {
  isSyncingFromFirestore = true;
  try {
    for (const remote of remoteEntries) {
      // Data from Firestore is by definition synced
      const synced: OperationEntry = { ...remote, syncPending: false };
      const local = await db.operations.get(remote.id);
      if (!local) {
        await db.operations.add(synced);
      } else if (remote.updatedAt > local.updatedAt) {
        await db.operations.put(synced);
      }
    }
  } finally {
    isSyncingFromFirestore = false;
  }
}

/**
 * When a user logs in, re-tag any pre-login local operations
 * (userId === 'local-user') with the real Firebase UID and push them to
 * Firestore so they appear on all the user's devices.
 */
export async function migrateLocalOps(realUserId: string): Promise<void> {
  if (!firestore || !isConfigured) return;

  const localOps = await db.operations
    .filter(op => op.userId === 'local-user')
    .toArray();

  if (localOps.length === 0) return;

  const reassigned = localOps.map(op => ({ ...op, userId: realUserId }));
  await db.operations.bulkPut(reassigned);

  for (const op of reassigned) {
    await pushToFirestore(op);
  }
}

// ─── Custom Procedure Types ─────────────────────────────────────────────────

const PROC_TYPES_COLLECTION = 'procedureTypes';

/**
 * Push a custom procedure type to Firestore.
 * Adds a `userId` field so Firestore security rules can filter per user.
 */
export async function pushProcedureTypeToFirestore(
  userId: string,
  entry: ProcedureType,
): Promise<void> {
  if (!firestore || !isConfigured) return;
  const ref = doc(firestore, PROC_TYPES_COLLECTION, entry.id);
  await setDoc(ref, { ...entry, userId }, { merge: true });
}

/**
 * Remove a custom procedure type from Firestore (called when user deletes locally).
 */
export async function deleteProcedureTypeFromFirestore(
  _userId: string,
  id: string,
): Promise<void> {
  if (!firestore || !isConfigured) return;
  await deleteDoc(doc(firestore, PROC_TYPES_COLLECTION, id));
}

/**
 * Subscribe to real-time updates of this user's custom procedure types.
 */
export function subscribeToProcedureTypes(
  userId: string,
  onUpdate: (entries: ProcedureType[]) => void,
): Unsubscribe {
  if (!firestore || !isConfigured) return () => {};

  const q = query(
    collection(firestore, PROC_TYPES_COLLECTION),
    where('userId', '==', userId),
  );

  return onSnapshot(q, snapshot => {
    const entries: ProcedureType[] = [];
    snapshot.forEach(d => {
      // Strip the Firestore-only userId field before storing locally
      const { userId: _uid, ...entry } = d.data() as ProcedureType & { userId?: string }; // eslint-disable-line @typescript-eslint/no-unused-vars
      entries.push(entry as ProcedureType);
    });
    onUpdate(entries);
  });
}

/**
 * Merge remote custom procedure types into local IndexedDB.
 * Remote always wins (types don't carry an updatedAt timestamp).
 */
export async function syncProcedureTypesFromFirestore(
  remoteTypes: ProcedureType[],
): Promise<void> {
  for (const remote of remoteTypes) {
    if (!remote.isCustom) continue;
    await db.procedureTypes.put(remote);
  }
}

// ─── User Settings ──────────────────────────────────────────────────────────

const SETTINGS_COLLECTION = 'userSettings';

export async function pushUserSettingsToFirestore(
  userId: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  if (!firestore || !isConfigured) return;
  const ref = doc(firestore, SETTINGS_COLLECTION, userId);
  await setDoc(ref, settings, { merge: true });
}

export function subscribeToUserSettings(
  userId: string,
  onUpdate: (settings: UserSettings) => void,
): Unsubscribe {
  if (!firestore || !isConfigured) return () => {};

  const ref = doc(firestore, SETTINGS_COLLECTION, userId);
  return onSnapshot(ref, snapshot => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as UserSettings);
    }
  });
}

// ─── Consent Records ─────────────────────────────────────────────────────────

const CONSENTS_COLLECTION = 'consents';

export async function saveConsentRecord(record: ConsentRecord): Promise<void> {
  if (!firestore || !isConfigured) return;
  const ref = doc(firestore, CONSENTS_COLLECTION, record.userId);
  await setDoc(ref, record);
}

export async function getConsentRecord(userId: string): Promise<ConsentRecord | null> {
  if (!firestore || !isConfigured) return null;
  const ref = doc(firestore, CONSENTS_COLLECTION, userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as ConsentRecord) : null;
}

// ─── Support Requests ────────────────────────────────────────────────────────

const SUPPORT_COLLECTION = 'supportRequests';
const SUPPORT_LIMITS_COLLECTION = 'supportLimits';
const SUPPORT_DAILY_LIMIT = 3;

export interface SupportRequest {
  userId: string;
  type: 'bug' | 'feature';
  subject: string;
  description: string;
  email: string;
  appVersion: string;
  userAgent: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt: string | null;
}

interface SupportLimit {
  count: number;
  windowStart: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Check if user is within the daily rate limit. Returns remaining submissions.
 * Resets the counter if the window date has changed (new day).
 */
export async function checkSupportRateLimit(
  userId: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!firestore || !isConfigured) return { allowed: true, remaining: SUPPORT_DAILY_LIMIT };

  const ref = doc(firestore, SUPPORT_LIMITS_COLLECTION, userId);
  const snap = await getDoc(ref);
  const today = new Date().toISOString().split('T')[0];

  if (!snap.exists()) {
    return { allowed: true, remaining: SUPPORT_DAILY_LIMIT };
  }

  const data = snap.data() as SupportLimit;
  if (data.windowStart !== today) {
    // New day — reset
    return { allowed: true, remaining: SUPPORT_DAILY_LIMIT };
  }

  const remaining = SUPPORT_DAILY_LIMIT - data.count;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

/**
 * Submit a support request and increment the user's daily rate-limit counter.
 */
export async function submitSupportRequest(
  userId: string,
  data: Omit<SupportRequest, 'userId' | 'createdAt' | 'resolved' | 'resolvedAt'>,
): Promise<void> {
  if (!firestore || !isConfigured) return;

  const id = `${userId}-${Date.now()}`;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  const request: SupportRequest = {
    ...data,
    userId,
    createdAt: now,
    resolved: false,
    resolvedAt: null,
  };

  await setDoc(doc(firestore, SUPPORT_COLLECTION, id), request);

  // Update rate-limit counter
  const limitRef = doc(firestore, SUPPORT_LIMITS_COLLECTION, userId);
  const limitSnap = await getDoc(limitRef);
  const limitData = limitSnap.exists() ? (limitSnap.data() as SupportLimit) : null;

  if (!limitData || limitData.windowStart !== today) {
    await setDoc(limitRef, { count: 1, windowStart: today });
  } else {
    await setDoc(limitRef, { count: limitData.count + 1, windowStart: today });
  }
}

// ─── Purge All User Data (for account deletion) ─────────────────────────────

export async function purgeAllUserData(userId: string): Promise<void> {
  if (!firestore || !isConfigured) return;

  // Delete all operations
  const opsQuery = query(
    collection(firestore, OPS_COLLECTION),
    where('userId', '==', userId),
  );
  const opsSnap = await getDocs(opsQuery);
  for (const d of opsSnap.docs) {
    await deleteDoc(d.ref);
  }

  // Delete all custom procedure types
  const typesQuery = query(
    collection(firestore, PROC_TYPES_COLLECTION),
    where('userId', '==', userId),
  );
  const typesSnap = await getDocs(typesQuery);
  for (const d of typesSnap.docs) {
    await deleteDoc(d.ref);
  }

  // Delete user settings
  await deleteDoc(doc(firestore, SETTINGS_COLLECTION, userId));

  // Delete consent record
  await deleteDoc(doc(firestore, CONSENTS_COLLECTION, userId));
}

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore, isConfigured } from './config';
import { db } from '../db/dexie';
import type { OperationEntry, ProcedureType } from '../types';

// ─── Operations ────────────────────────────────────────────────────────────────

const OPS_COLLECTION = 'operations';

export async function pushToFirestore(entry: OperationEntry) {
  if (!firestore || !isConfigured) return;
  const ref = doc(firestore, OPS_COLLECTION, entry.id);
  await setDoc(ref, entry, { merge: true });
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
  for (const remote of remoteEntries) {
    const local = await db.operations.get(remote.id);
    if (!local) {
      await db.operations.add(remote);
    } else if (remote.updatedAt > local.updatedAt) {
      await db.operations.put(remote);
    }
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
      const { userId: _uid, ...entry } = d.data() as ProcedureType & { userId?: string };
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

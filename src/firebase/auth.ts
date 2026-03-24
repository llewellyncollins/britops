import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  deleteUser,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';
import { purgeAllUserData } from './firestore';
import { db } from '../db/dexie';

const googleProvider = new GoogleAuthProvider();

export async function signInEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase not configured');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInGoogle() {
  if (!auth) throw new Error('Firebase not configured');
  return signInWithPopup(auth, googleProvider);
}

export async function signOut() {
  if (!auth) throw new Error('Firebase not configured');
  return fbSignOut(auth);
}

export async function deleteAccount(): Promise<void> {
  if (!auth?.currentUser) throw new Error('Not signed in');
  const user = auth.currentUser;

  // Purge all cloud data BEFORE deleting the auth account
  await purgeAllUserData(user.uid);

  // Clear all local data
  await db.operations.clear();
  await db.procedureTypes.clear();
  localStorage.removeItem('theatrelog-settings');

  // Delete the Firebase Auth account
  await deleteUser(user);
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

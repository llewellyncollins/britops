#!/usr/bin/env tsx
/**
 * Seed script for Firebase emulators.
 *
 * Run via: npm run emulator:seed
 * Requires emulators to be running first (npm run emulator:start).
 *
 * Creates:
 *   free@test.com       / password123  — unauthenticated-equivalent (not signed in via app)
 *   signed-in@test.com  / password123  — signed-in user (all features available)
 *   Sample operations for both users
 */

// Must be set before initializeApp
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'demo-britops';

// No service account credentials needed — Admin SDK detects emulator env vars above
const app = initializeApp({ projectId: PROJECT_ID });
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createOrGetUser(
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  try {
    const existing = await adminAuth.getUserByEmail(email);
    console.log(`  [skip] ${email} already exists (${existing.uid})`);
    return existing.uid;
  } catch {
    const user = await adminAuth.createUser({ email, password, displayName });
    console.log(`  [created] ${email} → ${user.uid}`);
    return user.uid;
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0]!;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ── Users ─────────────────────────────────────────────────────────────────────

console.log('\n[1/3] Creating users...');

const freeUid     = await createOrGetUser('free@test.com',      'password123', 'Free Tester');
const signedInUid = await createOrGetUser('signed-in@test.com', 'password123', 'Signed-In Tester');

// ── Custom Claims ─────────────────────────────────────────────────────────────

console.log('\n[2/3] Setting custom claims...');

await adminAuth.setCustomUserClaims(freeUid,     {});
console.log('  [ok] free@test.com — no special claims');

await adminAuth.setCustomUserClaims(signedInUid, {});
console.log('  [ok] signed-in@test.com — no special claims');

// ── Sample Operations ─────────────────────────────────────────────────────────

console.log('\n[3/3] Seeding sample operations...');

interface Op {
  id: string;
  userId: string;
  date: string;
  hospital: string;
  grade: string;
  patientId: string;
  chemotherapy: string;
  diagnosis: string;
  procedures: string[];
  involvement: 'assistant' | 'supervised' | 'independent';
  otherDetails: string;
  intraOpComplications: string;
  postOpComplications: string;
  histology: string;
  followUp: boolean;
  complexityScore: number | null;
  pci: number | null;
  discussedMDT: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  deletedAt: string | null;
  syncPending: boolean;
}

function makeOp(overrides: Partial<Op> & Pick<Op, 'id' | 'userId'>): Op {
  const ts = nowIso();
  return {
    date: daysAgo(7),
    hospital: "Guy's and St Thomas' NHS Foundation Trust",
    grade: 'Specialty Trainee 4 (ST4)',
    patientId: '',
    chemotherapy: '',
    diagnosis: 'Symptomatic gallstones',
    procedures: ['gs_lap_chole'],
    involvement: 'supervised',
    otherDetails: '',
    intraOpComplications: '',
    postOpComplications: '',
    histology: '',
    followUp: false,
    complexityScore: null,
    pci: null,
    discussedMDT: false,
    notes: '',
    createdAt: ts,
    updatedAt: ts,
    deleted: false,
    deletedAt: null,
    syncPending: false,
    ...overrides,
  };
}

const ops: Op[] = [
  // Free user (local-only ops — not synced until they sign in)
  makeOp({ id: 'free-op-001', userId: freeUid, date: daysAgo(14), diagnosis: 'Symptomatic gallstones', procedures: ['gs_lap_chole'], involvement: 'assistant' }),
  makeOp({ id: 'free-op-002', userId: freeUid, date: daysAgo(7),  diagnosis: 'Acute appendicitis',    procedures: ['gs_lap_appendicectomy'], involvement: 'supervised' }),
  // Signed-in user (ops synced to Firestore)
  makeOp({ id: 'si-op-001', userId: signedInUid, date: daysAgo(30), diagnosis: 'Carcinoma of the colon', procedures: ['gs_right_hemicolectomy'], involvement: 'independent' }),
  makeOp({ id: 'si-op-002', userId: signedInUid, date: daysAgo(21), diagnosis: 'Symptomatic gallstones', procedures: ['gs_lap_chole'],           involvement: 'supervised' }),
  makeOp({ id: 'si-op-003', userId: signedInUid, date: daysAgo(14), diagnosis: 'Incisional hernia',      procedures: ['gs_incisional_hernia'],    involvement: 'independent' }),
  makeOp({ id: 'si-op-004', userId: signedInUid, date: daysAgo(7),  diagnosis: 'Acute appendicitis',     procedures: ['gs_lap_appendicectomy'],   involvement: 'assistant' }),
];

for (const op of ops) {
  await adminDb.collection('operations').doc(op.id).set(op);
  console.log(`  [ok] ${op.id} (${op.userId === freeUid ? 'free' : 'signed-in'} user, ${op.involvement})`);
}

// ── Done ──────────────────────────────────────────────────────────────────────

console.log('\nSeed complete.');
console.log('  free@test.com       / password123  — use without signing in to test offline mode');
console.log('  signed-in@test.com  / password123  — sign in to test full feature set + sync');
console.log('\nEmulator UI: http://127.0.0.1:4000');

#!/usr/bin/env tsx
/**
 * Seed script for Firebase emulators.
 *
 * Run via: npm run emulator:seed
 * Requires emulators to be running first (npm run emulator:start).
 *
 * Creates:
 *   free@test.com / password123  — free tier (no stripeRole claim)
 *   pro@test.com  / password123  — pro tier  (stripeRole: "pro" custom claim)
 *   Stripe products + prices in Firestore
 *   Active subscription for pro user
 *   Sample operations for both users
 */

// Must be set before initializeApp
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

console.log('\n[1/5] Creating users...');

const freeUid = await createOrGetUser('free@test.com', 'password123', 'Free Tester');
const proUid  = await createOrGetUser('pro@test.com',  'password123', 'Pro Tester');

// ── Custom Claims ─────────────────────────────────────────────────────────────

console.log('\n[2/5] Setting custom claims...');

await adminAuth.setCustomUserClaims(freeUid, {});
console.log('  [ok] free@test.com — no stripeRole');

await adminAuth.setCustomUserClaims(proUid, { stripeRole: 'pro' });
console.log('  [ok] pro@test.com — stripeRole: "pro"');

// ── Stripe Products & Prices ──────────────────────────────────────────────────
// Mirrors the schema the Stripe Firebase Extension syncs from Stripe.
// getProProduct() queries: products (active=true, metadata.firebaseRole="pro")
//                          → prices subcollection (active=true)

console.log('\n[3/5] Seeding Stripe products & prices...');

const PRODUCT_ID      = 'prod_theatrelog_pro';
const PRICE_MONTHLY   = 'price_monthly_pro';
const PRICE_ANNUAL    = 'price_annual_pro';

const productRef = adminDb.collection('products').doc(PRODUCT_ID);
await productRef.set({
  active: true,
  name: 'Theatrelog Pro',
  description: 'Full access — sync, portfolio, export, custom procedures',
  metadata: { firebaseRole: 'pro' },
});
console.log(`  [ok] product: ${PRODUCT_ID}`);

await productRef.collection('prices').doc(PRICE_MONTHLY).set({
  active: true,
  currency: 'gbp',
  unit_amount: 999,
  type: 'recurring',
  interval: 'month',
  interval_count: 1,
  description: 'Monthly',
});
console.log(`  [ok] ${PRICE_MONTHLY} — £9.99/month`);

await productRef.collection('prices').doc(PRICE_ANNUAL).set({
  active: true,
  currency: 'gbp',
  unit_amount: 7999,
  type: 'recurring',
  interval: 'year',
  interval_count: 1,
  description: 'Annual (save 33%)',
});
console.log(`  [ok] ${PRICE_ANNUAL} — £79.99/year`);

// ── Pro Subscription ──────────────────────────────────────────────────────────

console.log('\n[4/5] Seeding pro subscription...');

const now          = Timestamp.now();
const oneYearLater = Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

await adminDb.collection('customers').doc(proUid).set({
  email: 'pro@test.com',
  stripeId: 'cus_emulator_pro_test',
});

await adminDb
  .collection('customers').doc(proUid)
  .collection('subscriptions').doc('sub_emulator_001')
  .set({
    status: 'active',
    current_period_start: now,
    current_period_end: oneYearLater,
    cancel_at_period_end: false,
    items: [{
      price: {
        id: PRICE_ANNUAL,
        product: {
          name: 'Theatrelog Pro',
          metadata: { firebaseRole: 'pro' },
        },
      },
    }],
  });
console.log('  [ok] sub_emulator_001 — active annual subscription for pro user');

// ── Sample Operations ─────────────────────────────────────────────────────────

console.log('\n[5/5] Seeding sample operations...');

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
  // Free user
  makeOp({ id: 'free-op-001', userId: freeUid, date: daysAgo(14), diagnosis: 'Symptomatic gallstones', procedures: ['gs_lap_chole'], involvement: 'assistant' }),
  makeOp({ id: 'free-op-002', userId: freeUid, date: daysAgo(7),  diagnosis: 'Acute appendicitis',    procedures: ['gs_lap_appendicectomy'], involvement: 'supervised' }),
  // Pro user
  makeOp({ id: 'pro-op-001', userId: proUid, date: daysAgo(30), diagnosis: 'Carcinoma of the colon',    procedures: ['gs_right_hemicolectomy'], involvement: 'independent' }),
  makeOp({ id: 'pro-op-002', userId: proUid, date: daysAgo(21), diagnosis: 'Symptomatic gallstones',    procedures: ['gs_lap_chole'],            involvement: 'supervised' }),
  makeOp({ id: 'pro-op-003', userId: proUid, date: daysAgo(14), diagnosis: 'Incisional hernia',         procedures: ['gs_incisional_hernia'],     involvement: 'independent' }),
  makeOp({ id: 'pro-op-004', userId: proUid, date: daysAgo(7),  diagnosis: 'Acute appendicitis',        procedures: ['gs_lap_appendicectomy'],    involvement: 'assistant' }),
];

for (const op of ops) {
  await adminDb.collection('operations').doc(op.id).set(op);
  console.log(`  [ok] ${op.id} (${op.userId === freeUid ? 'free' : 'pro'} user, ${op.involvement})`);
}

// ── Done ──────────────────────────────────────────────────────────────────────

console.log('\nSeed complete.');
console.log('  free@test.com / password123  — free tier');
console.log('  pro@test.com  / password123  — pro tier (stripeRole: "pro")');
console.log('\nEmulator UI: http://127.0.0.1:4000');

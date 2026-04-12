import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions, isConfigured } from './config';
import type { User } from 'firebase/auth';

export interface StripePrice {
  id: string;
  active: boolean;
  currency: string;
  unit_amount: number;
  type: 'recurring' | 'one_time';
  interval?: 'month' | 'year';
  interval_count?: number;
  description?: string;
}

export interface StripeProduct {
  id: string;
  active: boolean;
  name: string;
  description?: string;
  metadata: Record<string, string>;
  prices: StripePrice[];
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_end: { seconds: number };
  current_period_start: { seconds: number };
  cancel_at_period_end: boolean;
  items: Array<{
    price: {
      id: string;
      product: { name: string; metadata: Record<string, string> };
    };
  }>;
}

/**
 * Fetch the active "Pro" product with its prices from the products collection
 * (auto-synced by the Stripe Firebase Extension).
 */
export async function getProProduct(): Promise<StripeProduct | null> {
  if (!firestore || !isConfigured) return null;

  const productsRef = collection(firestore, 'products');
  const q = query(productsRef, where('active', '==', true));
  const snap = await getDocs(q);

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.metadata?.firebaseRole !== 'pro') continue;

    // Fetch prices subcollection
    const pricesRef = collection(firestore, 'products', doc.id, 'prices');
    const pricesSnap = await getDocs(query(pricesRef, where('active', '==', true)));
    const prices: StripePrice[] = pricesSnap.docs.map(p => ({
      id: p.id,
      ...p.data(),
    } as StripePrice));

    return {
      id: doc.id,
      active: data.active,
      name: data.name,
      description: data.description,
      metadata: data.metadata,
      prices,
    };
  }

  return null;
}

/**
 * Create a Stripe Checkout session by writing to the customer's
 * checkout_sessions subcollection. The Firebase Extension picks this up
 * and populates a `url` field that we redirect to.
 *
 * Returns a promise that resolves with the Stripe Checkout URL.
 */
export async function createCheckoutSession(
  user: User,
  priceId: string,
): Promise<string> {
  if (!firestore || !isConfigured) {
    throw new Error('Firebase not configured');
  }

  // The Stripe Extension doesn't run in the local emulator.
  // Sign in as pro@test.com to get Pro access without going through checkout.
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    console.warn('[emulator] Stripe checkout mocked — use npm run dev (staging) for real payments');
    return `https://checkout.stripe.com/c/pay/emulator_mock?priceId=${priceId}`;
  }

  const sessionsRef = collection(firestore, 'customers', user.uid, 'checkout_sessions');
  const docRef = await addDoc(sessionsRef, {
    price: priceId,
    success_url: `${window.location.origin}/settings?upgraded=true`,
    cancel_url: `${window.location.origin}/upgrade`,
    allow_promotion_codes: true,
  });

  // Wait for the extension to populate the checkout URL
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsub();
      reject(new Error('Checkout session creation timed out'));
    }, 30000);

    const unsub = onSnapshot(docRef, (snap) => {
      const data = snap.data();
      if (data?.url) {
        clearTimeout(timeout);
        unsub();
        resolve(data.url as string);
      }
      if (data?.error) {
        clearTimeout(timeout);
        unsub();
        reject(new Error(data.error.message));
      }
    });
  });
}

/**
 * Get the user's active subscription from the subscriptions subcollection.
 */
export async function getActiveSubscription(
  userId: string,
): Promise<StripeSubscription | null> {
  if (!firestore || !isConfigured) return null;

  const subsRef = collection(firestore, 'customers', userId, 'subscriptions');
  const q = query(subsRef, where('status', 'in', ['active', 'trialing']));
  const snap = await getDocs(q);

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as StripeSubscription;
}

/**
 * Create a Stripe Customer Portal session for managing subscription.
 * Uses the Firebase Extension's createPortalLink callable function.
 */
export async function createPortalSession(): Promise<string> {
  if (!functions || !isConfigured) {
    throw new Error('Firebase not configured');
  }

  // The Stripe Extension's createPortalLink function doesn't run in the local emulator.
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    return 'http://127.0.0.1:4000';
  }

  const createPortalLink = httpsCallable<
    { returnUrl: string },
    { url: string }
  >(functions, 'ext-firestore-stripe-payments-createPortalLink');

  const result = await createPortalLink({
    returnUrl: `${window.location.origin}/settings`,
  });

  return result.data.url;
}

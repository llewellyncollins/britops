import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let firestore: ReturnType<typeof getFirestore> | null = null;
let functions: ReturnType<typeof getFunctions> | null = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Do NOT enable IndexedDB persistence — Dexie is the offline store.
  // With persistence enabled, setDoc resolves against the local cache before
  // the server confirms, so security-rule rejections and network errors never
  // surface to our try/catch blocks, causing silent write failures.
  firestore = getFirestore(app);
  functions = getFunctions(app, 'europe-west2');

  if (useEmulators) {
    // Use 127.0.0.1 not localhost — avoids IPv6 (::1) resolution issues on Windows
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.info('[emulator] Connected: Auth:9099  Firestore:8080  Functions:5001');
  }
}

export { app, auth, firestore, functions, isConfigured, useEmulators };

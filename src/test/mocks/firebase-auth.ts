import { vi } from 'vitest';

const authChangeCallbacks = new Set<(user: unknown) => void>();

export const mockSignInEmail = vi.fn().mockResolvedValue({ user: null });
export const mockSignUpEmail = vi.fn().mockResolvedValue({ user: null });
export const mockSignInGoogle = vi.fn().mockResolvedValue({ user: null });
export const mockSignOut = vi.fn().mockResolvedValue(undefined);
export const mockDeleteAccount = vi.fn().mockResolvedValue(undefined);
export const mockOnAuthChange = vi.fn((cb: (user: unknown) => void) => {
  authChangeCallbacks.add(cb);
  // Call with null initially (no user signed in)
  cb(null);
  return () => {
    authChangeCallbacks.delete(cb);
  };
});

/**
 * Simulate a sign-in by triggering the auth change callback with a user object.
 */
export function triggerAuthChange(user: unknown) {
  for (const cb of authChangeCallbacks) {
    cb(user);
  }
}

/**
 * Call this in your test file to set up the Firebase auth mock.
 * Must be called at the top level of the test file (not inside describe/it).
 *
 * Usage:
 *   vi.mock('../../firebase/auth', () => setupAuthMock());
 */
export function setupAuthMock() {
  return {
    signInEmail: mockSignInEmail,
    signUpEmail: mockSignUpEmail,
    signInGoogle: mockSignInGoogle,
    signOut: mockSignOut,
    deleteAccount: mockDeleteAccount,
    onAuthChange: mockOnAuthChange,
  };
}

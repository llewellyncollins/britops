import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

let authCallback: ((user: unknown) => void) | null = null;

vi.mock('../firebase/auth', () => ({
  onAuthChange: vi.fn((cb: (user: unknown) => void) => {
    authCallback = cb;
    return () => {
      authCallback = null;
    };
  }),
}));

// Test with Firebase NOT configured
vi.mock('../firebase/config', () => ({
  isConfigured: false,
  app: null,
  auth: null,
  firestore: null,
}));

const { useAuth } = await import('./useAuth');

describe('useAuth', () => {
  beforeEach(() => {
    authCallback = null;
  });

  it('starts with no user when firebase is not configured', () => {
    const { result } = renderHook(() => useAuth());
    // When isConfigured is false, loading starts as false
    expect(result.current.loading).toBe(false);
    expect(result.current.isConfigured).toBe(false);
  });

  it('sets user when auth callback fires', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      if (authCallback) {
        authCallback({ uid: 'user-123', email: 'test@example.com' });
      }
    });

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  it('clears user when auth callback fires with null', async () => {
    const { result } = renderHook(() => useAuth());

    // First sign in
    await act(async () => {
      if (authCallback) {
        authCallback({ uid: 'user-123', email: 'test@example.com' });
      }
    });

    // Then sign out
    await act(async () => {
      if (authCallback) {
        authCallback(null);
      }
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  it('cleanup unsubscribes from auth listener', () => {
    const { unmount } = renderHook(() => useAuth());
    unmount();
    // After unmount, the callback should be cleaned up
    expect(authCallback).toBeNull();
  });
});

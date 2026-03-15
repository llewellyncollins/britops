import { vi } from 'vitest';

export const mockIsConfigured = vi.fn(() => false);

/**
 * Call this in your test file to set up the Firebase config mock.
 *
 * Usage:
 *   vi.mock('../../firebase/config', () => setupConfigMock());
 */
export function setupConfigMock() {
  return {
    isConfigured: false,
    app: null,
    auth: null,
    firestore: null,
  };
}

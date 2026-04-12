import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { db } from '../db/dexie';
import { createOperation } from '../test/factories';
import {
  setupAuthMock,
  triggerAuthChange,
  mockDeleteAccount,
} from '../test/mocks/firebase-auth';
import { setupFirestoreMock } from '../test/mocks/firebase-firestore';
import { renderWithProviders } from '../test/render-with-providers';

vi.mock('../firebase/auth', () => setupAuthMock());
vi.mock('../firebase/firestore', () => setupFirestoreMock());
vi.mock('../firebase/config', () => ({
  isConfigured: true,
  app: null,
  auth: null,
  firestore: null,
}));

const { SettingsPage } = await import('./SettingsPage');

describe('SettingsPage — GDPR features', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    if (!db.isOpen()) {
      await db.open();
    }
  });

  describe('when signed out', () => {
    it('shows Privacy Policy and Terms links', () => {
      renderWithProviders(<SettingsPage />, { route: '/settings' });

      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    });

    it('does not show Delete Account button', () => {
      renderWithProviders(<SettingsPage />, { route: '/settings' });

      expect(screen.queryByText(/Delete Account/)).not.toBeInTheDocument();
    });

    it('shows JSON export button behind locked overlay', () => {
      renderWithProviders(<SettingsPage />, { route: '/settings' });

      // LockedFeature renders the content with reduced opacity + lock overlay
      expect(screen.getByText(/Export All My Data/)).toBeInTheDocument();
    });
  });

  describe('when signed in', () => {
    const mockUser = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
    };

    async function renderSignedIn() {
      renderWithProviders(<SettingsPage />, { route: '/settings' });
      // Trigger auth after render so the onAuthChange callback is registered
      triggerAuthChange(mockUser);
      await waitFor(() => {
        expect(screen.getByText('Delete Account & All Data')).toBeInTheDocument();
      });
    }

    it('shows Delete Account button', async () => {
      await renderSignedIn();
      expect(screen.getByText('Delete Account & All Data')).toBeInTheDocument();
    });

    it('shows JSON export button (locked behind Pro)', async () => {
      await renderSignedIn();
      expect(screen.getByText('Export All My Data (JSON)')).toBeInTheDocument();
    });

    it('delete account requires two-step confirmation', async () => {
      await renderSignedIn();

      // First click — shows confirmation
      fireEvent.click(screen.getByText('Delete Account & All Data'));

      expect(screen.getByText(/Confirm: Delete Everything/)).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('cancel resets delete confirmation', async () => {
      await renderSignedIn();

      fireEvent.click(screen.getByText('Delete Account & All Data'));
      expect(screen.getByText(/Confirm: Delete Everything/)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.getByText('Delete Account & All Data')).toBeInTheDocument();
    });

    it('second click calls deleteAccount', async () => {
      await renderSignedIn();

      // First click
      fireEvent.click(screen.getByText('Delete Account & All Data'));
      // Second click — confirm
      fireEvent.click(screen.getByText(/Confirm: Delete Everything/));

      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalledOnce();
      });
    });
  });

  describe('data retention info', () => {
    it('shows 30-day purge notice in About section', () => {
      renderWithProviders(<SettingsPage />, { route: '/settings' });

      expect(screen.getByText(/permanently purged after 30 days/)).toBeInTheDocument();
    });
  });

  describe('sign-in redirect', () => {
    it('shows a sign-in redirect button when not authenticated', () => {
      renderWithProviders(<SettingsPage />, { route: '/settings' });

      // The Account section has a "Sign in" button (separate from LockedFeature overlays)
      expect(screen.getByText('Unlock imports, support, and more')).toBeInTheDocument();
    });
  });

  describe('clear local data', () => {
    it('shows clear operations button', () => {
      renderWithProviders(<SettingsPage />, { route: '/settings' });

      expect(screen.getByText('Clear all operations')).toBeInTheDocument();
    });

    it('clears local IndexedDB on confirm', async () => {
      await db.operations.add(createOperation({ userId: 'test-user' }));
      expect(await db.operations.count()).toBe(1);

      // Mock window.confirm (happy-dom may not define it)
      globalThis.confirm = vi.fn().mockReturnValue(true);

      renderWithProviders(<SettingsPage />, { route: '/settings' });
      fireEvent.click(screen.getByText('Clear all operations'));

      await waitFor(async () => {
        expect(await db.operations.count()).toBe(0);
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/render-with-providers';
import { setupAuthMock, mockSignOut } from '../test/mocks/firebase-auth';
import { setupFirestoreMock } from '../test/mocks/firebase-firestore';

vi.mock('../firebase/auth', () => setupAuthMock());
vi.mock('../firebase/firestore', () => setupFirestoreMock());
vi.mock('../firebase/config', () => ({
  isConfigured: true,
  app: null,
  auth: null,
  firestore: null,
}));

vi.mock('../firebase/analytics', () => ({
  trackPageView: vi.fn(),
  trackSignOut: vi.fn(),
  trackSignInPrompted: vi.fn(),
  trackThemeChanged: vi.fn(),
  trackGradeSet: vi.fn(),
  trackSpecialtySet: vi.fn(),
  trackProcedureTypesOpened: vi.fn(),
  trackExport: vi.fn(),
  trackImport: vi.fn(),
  trackDataCleared: vi.fn(),
  trackAccountDeleteInitiated: vi.fn(),
  trackAccountDeleteConfirmed: vi.fn(),
  trackSupportOpened: vi.fn(),
  trackPrivacyPolicyViewed: vi.fn(),
  trackTermsViewed: vi.fn(),
  trackCustomProcedureAdded: vi.fn(),
}));

vi.mock('../hooks/useOperations', () => ({
  useOperations: vi.fn(() => ({
    operations: [],
    addOperation: vi.fn(),
    updateOperation: vi.fn(),
    deleteOperation: vi.fn(),
  })),
}));

vi.mock('../hooks/useProcedureTypes', () => ({
  useProcedureTypes: vi.fn(() => ({
    allProcedures: [],
    customTypes: [],
    specialties: ['General Surgery'],
    addProcedureType: vi.fn(),
    removeProcedureType: vi.fn(),
  })),
}));

const mockCan = vi.fn(() => true);
vi.mock('../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'signed-in',
    can: mockCan,
    requiredTier: () => 'signed-in',
    loading: false,
  })),
}));

const mockUser = { uid: 'test-uid', email: 'test@test.com' };
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: false,
    isConfigured: true,
  })),
}));

vi.mock('../utils/excel', () => ({
  exportPortfolioXlsx: vi.fn(),
  importFromXlsx: vi.fn(),
}));

vi.mock('../utils/export', () => ({
  exportAllDataJson: vi.fn(),
}));

const { SettingsPage } = await import('./SettingsPage');

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCan.mockReturnValue(true);
  });

  it('renders the Settings heading', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders Appearance section with theme buttons', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('renders Clinical Profile section', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Clinical Profile')).toBeInTheDocument();
  });

  it('renders Your Specialty section', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Your Specialty')).toBeInTheDocument();
  });

  it('renders Account section for signed-in user', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('renders Procedure Types toggle', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Procedure Types')).toBeInTheDocument();
  });

  it('toggles Procedure Types panel', () => {
    renderWithProviders(<SettingsPage />);
    const btn = screen.getByText('Procedure Types').closest('button')!;
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('renders Export section', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Export Portfolio (Excel)')).toBeInTheDocument();
    expect(screen.getByText('Export to CSV')).toBeInTheDocument();
    expect(screen.getByText('Export All My Data (JSON)')).toBeInTheDocument();
  });

  it('renders Import section', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Import from Excel')).toBeInTheDocument();
  });

  it('renders Privacy & Data section with links', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('renders Danger Zone section', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Clear all operations')).toBeInTheDocument();
    expect(screen.getByText('Delete Account & All Data')).toBeInTheDocument();
  });

  it('renders About section', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText(/Theatrelog v/)).toBeInTheDocument();
  });

  it('renders Support section', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Get help or report an issue')).toBeInTheDocument();
  });

  it('shows syncing enabled for signed-in user', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Syncing enabled')).toBeInTheDocument();
  });

  it('can click theme buttons', () => {
    renderWithProviders(<SettingsPage />);
    fireEvent.click(screen.getByText('Dark'));
    fireEvent.click(screen.getByText('Light'));
    fireEvent.click(screen.getByText('System'));
  });

  it('can click sign out button', () => {
    renderWithProviders(<SettingsPage />);
    fireEvent.click(screen.getByText('Sign out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('can click export buttons', () => {
    renderWithProviders(<SettingsPage />);
    fireEvent.click(screen.getByText('Export Portfolio (Excel)'));
    fireEvent.click(screen.getByText('Export to CSV'));
  });

  it('renders delete account button for signed-in user', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Delete Account & All Data')).toBeInTheDocument();
  });

  it('shows confirm step on delete account click', () => {
    renderWithProviders(<SettingsPage />);
    fireEvent.click(screen.getByText('Delete Account & All Data'));
    expect(screen.getByText('Confirm: Delete Everything')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('can cancel delete account', () => {
    renderWithProviders(<SettingsPage />);
    fireEvent.click(screen.getByText('Delete Account & All Data'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Delete Account & All Data')).toBeInTheDocument();
  });
});

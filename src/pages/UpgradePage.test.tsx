import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/render-with-providers';

vi.mock('../firebase/analytics', () => ({
  trackUpgradePageViewed: vi.fn(),
  trackCheckoutStarted: vi.fn(),
}));

const mockUser = { uid: 'test-uid', email: 'test@test.com', getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }) };
const mockUseAuth = vi.fn(() => ({ user: mockUser, loading: false, isConfigured: true }));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockCan = vi.fn(() => false);
const mockTier = vi.fn(() => 'signed-in');

vi.mock('../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: mockTier(),
    can: mockCan,
    requiredTier: () => 'paid',
    loading: false,
    refreshClaims: vi.fn(),
  })),
}));

const mockGetProProduct = vi.fn().mockResolvedValue(null);
const mockCreateCheckoutSession = vi.fn().mockResolvedValue('https://checkout.stripe.com/test');
const mockCreatePortalSession = vi.fn().mockResolvedValue('https://billing.stripe.com/test');

vi.mock('../firebase/stripe', () => ({
  getProProduct: (...args: unknown[]) => mockGetProProduct(...args),
  createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
  createPortalSession: (...args: unknown[]) => mockCreatePortalSession(...args),
}));

const { UpgradePage } = await import('./UpgradePage');

describe('UpgradePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTier.mockReturnValue('signed-in');
    mockCan.mockReturnValue(false);
    mockGetProProduct.mockResolvedValue(null);
  });

  it('renders the Theatrelog Pro heading', async () => {
    renderWithProviders(<UpgradePage />);
    expect(screen.getByText('Theatrelog Pro')).toBeInTheDocument();
  });

  it('shows loading spinner while fetching prices', () => {
    mockGetProProduct.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<UpgradePage />);
    // Loading state active
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });

  it('shows pricing not available message when no prices', async () => {
    mockGetProProduct.mockResolvedValue(null);
    renderWithProviders(<UpgradePage />);

    await waitFor(() => {
      expect(screen.getByText(/Pricing is being set up/)).toBeInTheDocument();
    });
  });

  it('shows pricing toggle when prices are available', async () => {
    mockGetProProduct.mockResolvedValue({
      id: 'prod_test',
      active: true,
      name: 'Pro',
      metadata: { firebaseRole: 'pro' },
      prices: [
        { id: 'price_month', active: true, currency: 'gbp', unit_amount: 499, type: 'recurring', interval: 'month' },
        { id: 'price_year', active: true, currency: 'gbp', unit_amount: 3999, type: 'recurring', interval: 'year' },
      ],
    });

    renderWithProviders(<UpgradePage />);

    await waitFor(() => {
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('Annual')).toBeInTheDocument();
    });
  });

  it('shows feature comparison table', async () => {
    renderWithProviders(<UpgradePage />);

    await waitFor(() => {
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('Log operations offline')).toBeInTheDocument();
      expect(screen.getByText('Cloud sync across devices')).toBeInTheDocument();
    });
  });

  it('shows manage subscription for paid users', async () => {
    mockTier.mockReturnValue('paid');

    renderWithProviders(<UpgradePage />);

    await waitFor(() => {
      expect(screen.getByText(/full access/)).toBeInTheDocument();
      expect(screen.getByText('Manage subscription')).toBeInTheDocument();
    });
  });

  it('toggles billing period', async () => {
    mockGetProProduct.mockResolvedValue({
      id: 'prod_test',
      active: true,
      name: 'Pro',
      metadata: { firebaseRole: 'pro' },
      prices: [
        { id: 'price_month', active: true, currency: 'gbp', unit_amount: 499, type: 'recurring', interval: 'month' },
        { id: 'price_year', active: true, currency: 'gbp', unit_amount: 3999, type: 'recurring', interval: 'year' },
      ],
    });

    renderWithProviders(<UpgradePage />);

    await waitFor(() => {
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Monthly'));
    // Should show monthly pricing
    expect(screen.getByText(/£4.99\/mo/)).toBeInTheDocument();
  });
});

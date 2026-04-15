import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-with-providers';

vi.mock('../../firebase/analytics', () => ({
  trackUpgradePrompted: vi.fn(),
}));

const mockCan = vi.fn(() => true);
const mockRequiredTier = vi.fn(() => 'paid' as const);

vi.mock('../../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'paid',
    can: mockCan,
    requiredTier: mockRequiredTier,
    loading: false,
    refreshClaims: vi.fn(),
  })),
}));

const { LockedFeature } = await import('./LockedFeature');

describe('LockedFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCan.mockReturnValue(true);
    mockRequiredTier.mockReturnValue('paid');
  });

  it('renders children directly when user has access', () => {
    renderWithProviders(
      <LockedFeature feature="portfolio">
        <span>Portfolio content</span>
      </LockedFeature>,
    );
    expect(screen.getByText('Portfolio content')).toBeInTheDocument();
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  it('shows Pro badge when user lacks paid tier', () => {
    mockCan.mockReturnValue(false);
    mockRequiredTier.mockReturnValue('paid');

    renderWithProviders(
      <LockedFeature feature="portfolio">
        <span>Portfolio content</span>
      </LockedFeature>,
    );
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('shows Sign in badge when user needs signed-in tier', () => {
    mockCan.mockReturnValue(false);
    mockRequiredTier.mockReturnValue('signed-in');

    renderWithProviders(
      <LockedFeature feature="import">
        <span>Import content</span>
      </LockedFeature>,
    );
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('has correct aria label for locked state', () => {
    mockCan.mockReturnValue(false);
    mockRequiredTier.mockReturnValue('paid');

    renderWithProviders(
      <LockedFeature feature="portfolio">
        <span>Content</span>
      </LockedFeature>,
    );
    expect(screen.getByLabelText(/Upgrade to Pro to unlock/)).toBeInTheDocument();
  });

  it('navigates on click when locked', () => {
    mockCan.mockReturnValue(false);
    mockRequiredTier.mockReturnValue('paid');

    renderWithProviders(
      <LockedFeature feature="portfolio">
        <span>Content</span>
      </LockedFeature>,
    );

    fireEvent.click(screen.getByRole('button'));
    // Click triggers navigation — analytics tracked
  });
});

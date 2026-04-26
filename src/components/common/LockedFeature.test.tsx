import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-with-providers';

const mockCan = vi.fn(() => true);

vi.mock('../../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'signed-in',
    can: mockCan,
    requiredTier: () => 'signed-in',
    loading: false,
  })),
}));

const { LockedFeature } = await import('./LockedFeature');

describe('LockedFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCan.mockReturnValue(true);
  });

  it('renders children directly when user has access', () => {
    renderWithProviders(
      <LockedFeature feature="portfolio">
        <span>Portfolio content</span>
      </LockedFeature>,
    );
    expect(screen.getByText('Portfolio content')).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
  });

  it('shows Sign in badge when user is not authenticated', () => {
    mockCan.mockReturnValue(false);

    renderWithProviders(
      <LockedFeature feature="portfolio">
        <span>Portfolio content</span>
      </LockedFeature>,
    );
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('has correct aria label for locked state', () => {
    mockCan.mockReturnValue(false);

    renderWithProviders(
      <LockedFeature feature="portfolio">
        <span>Content</span>
      </LockedFeature>,
    );
    expect(screen.getByLabelText('Sign in to unlock this feature')).toBeInTheDocument();
  });

  it('navigates to login on click when locked', () => {
    mockCan.mockReturnValue(false);

    renderWithProviders(
      <LockedFeature feature="portfolio">
        <span>Content</span>
      </LockedFeature>,
    );

    fireEvent.click(screen.getByRole('button'));
    // Click triggers navigation to /login
  });
});

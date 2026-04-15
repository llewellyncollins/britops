import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-with-providers';

const mockCan = vi.fn(() => true);

vi.mock('../../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'paid',
    can: mockCan,
    requiredTier: () => 'free',
    loading: false,
    refreshClaims: vi.fn(),
  })),
}));

const { BottomNav } = await import('./BottomNav');

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCan.mockReturnValue(true);
  });

  it('renders all navigation items', () => {
    renderWithProviders(<BottomNav />);
    expect(screen.getByText('Logbook')).toBeInTheDocument();
    expect(screen.getByText('Log Op')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    renderWithProviders(<BottomNav />);
    expect(screen.getByText('Logbook').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Log Op').closest('a')).toHaveAttribute('href', '/log');
    expect(screen.getByText('Portfolio').closest('a')).toHaveAttribute('href', '/portfolio');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings');
  });

  it('shows lock icon on gated features when user cannot access', () => {
    mockCan.mockReturnValue(false);
    renderWithProviders(<BottomNav />);
    expect(screen.getByLabelText('Pro feature')).toBeInTheDocument();
  });

  it('does not show lock icon when user has access', () => {
    mockCan.mockReturnValue(true);
    renderWithProviders(<BottomNav />);
    expect(screen.queryByLabelText('Pro feature')).not.toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-with-providers';

// AppShell uses useTier via BottomNav, mock it
import { vi } from 'vitest';

vi.mock('../../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'signed-in',
    can: () => true,
    requiredTier: () => 'signed-in',
    loading: false,
  })),
}));

const { AppShell } = await import('./AppShell');

describe('AppShell', () => {
  it('renders the header with logo', () => {
    renderWithProviders(<AppShell />);
    expect(screen.getByAltText('Theatrelog')).toBeInTheDocument();
  });

  it('renders skip to content link', () => {
    renderWithProviders(<AppShell />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders the logo as a link to dashboard', () => {
    renderWithProviders(<AppShell />);
    const link = screen.getByLabelText('Go to dashboard');
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders main content area', () => {
    renderWithProviders(<AppShell />);
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  it('renders the bottom navigation', () => {
    renderWithProviders(<AppShell />);
    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
  });
});

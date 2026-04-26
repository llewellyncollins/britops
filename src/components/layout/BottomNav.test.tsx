import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-with-providers';

const { BottomNav } = await import('./BottomNav');

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('does not show lock icons on any nav items', () => {
    renderWithProviders(<BottomNav />);
    expect(screen.queryByLabelText('Pro feature')).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render-with-providers';
import { createOperation } from '../test/factories';

vi.mock('../firebase/analytics', () => ({
  trackPageView: vi.fn(),
}));

vi.mock('../hooks/useOperations', () => ({
  useOperations: vi.fn(() => ({
    operations: [],
    addOperation: vi.fn(),
    updateOperation: vi.fn(),
    deleteOperation: vi.fn(),
  })),
}));

const { useOperations } = await import('../hooks/useOperations');
const { Dashboard } = await import('./Dashboard');

describe('Dashboard', () => {
  it('renders the Logbook heading', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Logbook')).toBeInTheDocument();
  });

  it('shows operation count', () => {
    vi.mocked(useOperations).mockReturnValue({
      operations: [createOperation(), createOperation()],
      addOperation: vi.fn(),
      updateOperation: vi.fn(),
      deleteOperation: vi.fn(),
    });

    renderWithProviders(<Dashboard />);
    expect(screen.getByText('2 operations')).toBeInTheDocument();
  });

  it('shows 0 operations when empty', () => {
    vi.mocked(useOperations).mockReturnValue({
      operations: [],
      addOperation: vi.fn(),
      updateOperation: vi.fn(),
      deleteOperation: vi.fn(),
    });

    renderWithProviders(<Dashboard />);
    expect(screen.getByText('0 operations')).toBeInTheDocument();
  });
});

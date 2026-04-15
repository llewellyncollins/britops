import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render-with-providers';

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

vi.mock('../hooks/useProcedureTypes', () => ({
  useProcedureTypes: vi.fn(() => ({
    allProcedures: [],
    customTypes: [],
    specialties: ['General Surgery'],
    addProcedureType: vi.fn(),
    removeProcedureType: vi.fn(),
  })),
}));

vi.mock('../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'paid',
    can: () => true,
    requiredTier: () => 'free',
    loading: false,
    refreshClaims: vi.fn(),
  })),
}));

// Mock dexie-react-hooks to return undefined (loading state) by default
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => undefined),
}));

const { useLiveQuery } = await import('dexie-react-hooks');
const { EditOperation } = await import('./EditOperation');

describe('EditOperation', () => {
  it('shows loading state when operation is undefined', () => {
    vi.mocked(useLiveQuery).mockReturnValue(undefined);
    renderWithProviders(<EditOperation />, { route: '/edit/test-id' });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to dashboard when operation is null (not found)', () => {
    vi.mocked(useLiveQuery).mockReturnValue(null);
    renderWithProviders(<EditOperation />, { route: '/edit/nonexistent' });
    // Should redirect — no loading or edit heading visible
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Operation')).not.toBeInTheDocument();
  });
});

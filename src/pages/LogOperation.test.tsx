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
    tier: 'signed-in',
    can: () => true,
    requiredTier: () => 'signed-in',
    loading: false,
  })),
}));

const { LogOperation } = await import('./LogOperation');

describe('LogOperation', () => {
  it('renders the Log Operation heading', () => {
    renderWithProviders(<LogOperation />);
    expect(screen.getByText('Log Operation')).toBeInTheDocument();
  });

  it('renders the specialty selector', () => {
    renderWithProviders(<LogOperation />);
    expect(screen.getByLabelText('Specialty')).toBeInTheDocument();
  });

  it('renders a save button', () => {
    renderWithProviders(<LogOperation />);
    expect(screen.getByText('Save Operation')).toBeInTheDocument();
  });
});

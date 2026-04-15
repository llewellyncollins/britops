import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-with-providers';
import type { ProcedureType } from '../../types';

vi.mock('../../firebase/analytics', () => ({
  trackCustomProcedureAdded: vi.fn(),
  trackUpgradePrompted: vi.fn(),
}));

const mockAddProcedureType = vi.fn();
const mockRemoveProcedureType = vi.fn();
const mockProcedures: ProcedureType[] = [
  { id: 'gs_lap_chole', name: 'Laparoscopic cholecystectomy', category: 'Hepatobiliary', specialty: 'General Surgery', isCustom: false },
  { id: 'custom_test', name: 'Custom Proc', category: 'Custom Cat', specialty: 'General Surgery', isCustom: true },
];

vi.mock('../../hooks/useProcedureTypes', () => ({
  useProcedureTypes: vi.fn(() => ({
    allProcedures: mockProcedures,
    customTypes: mockProcedures.filter(p => p.isCustom),
    specialties: ['General Surgery'],
    addProcedureType: mockAddProcedureType,
    removeProcedureType: mockRemoveProcedureType,
  })),
}));

const mockCan = vi.fn(() => true);
vi.mock('../../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'paid',
    can: mockCan,
    requiredTier: () => 'paid',
    loading: false,
    refreshClaims: vi.fn(),
  })),
}));

const { ProcedureTypeManager } = await import('./ProcedureTypeManager');

describe('ProcedureTypeManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCan.mockReturnValue(true);
  });

  it('renders add custom procedure button', () => {
    renderWithProviders(<ProcedureTypeManager />);
    expect(screen.getByText('Add custom procedure')).toBeInTheDocument();
  });

  it('shows add form when button is clicked', () => {
    renderWithProviders(<ProcedureTypeManager />);
    fireEvent.click(screen.getByText('Add custom procedure'));
    expect(screen.getByText('New Procedure')).toBeInTheDocument();
    expect(screen.getByLabelText(/Specialty/)).toBeInTheDocument();
  });

  it('shows custom procedure entries after expanding specialty', () => {
    renderWithProviders(<ProcedureTypeManager />);
    expect(screen.getByText(/Your custom procedures/i)).toBeInTheDocument();
    // Expand the custom specialty group (first one with aria-controls starting with custom-sp-)
    const expandBtn = screen.getByRole('button', { name: /General Surgery.*1/ });
    fireEvent.click(expandBtn);
    expect(screen.getByText('Custom Proc')).toBeInTheDocument();
  });
});

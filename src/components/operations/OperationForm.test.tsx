import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-with-providers';
import { createOperation } from '../../test/factories';

vi.mock('../../hooks/useOperations', () => ({
  useOperations: vi.fn(() => ({
    operations: [],
    addOperation: vi.fn(),
    updateOperation: vi.fn(),
    deleteOperation: vi.fn(),
  })),
}));

vi.mock('../../hooks/useProcedureTypes', () => ({
  useProcedureTypes: vi.fn(() => ({
    allProcedures: [
      { id: 'gs_lap_chole', name: 'Laparoscopic cholecystectomy', category: 'Hepatobiliary', specialty: 'General Surgery', isCustom: false },
    ],
    customTypes: [],
    specialties: ['General Surgery', 'Orthopaedics'],
    addProcedureType: vi.fn(),
    removeProcedureType: vi.fn(),
  })),
}));

vi.mock('../../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'signed-in',
    can: () => true,
    requiredTier: () => 'signed-in',
    loading: false,
  })),
}));

const { OperationForm } = await import('./OperationForm');

describe('OperationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Log Operation heading for new operation', () => {
    renderWithProviders(<OperationForm />);
    expect(screen.getByText('Log Operation')).toBeInTheDocument();
  });

  it('renders Edit Operation heading when editing', () => {
    renderWithProviders(<OperationForm existing={createOperation()} />);
    expect(screen.getByText('Edit Operation')).toBeInTheDocument();
  });

  it('renders Save Operation button for new operation', () => {
    renderWithProviders(<OperationForm />);
    expect(screen.getByText('Save Operation')).toBeInTheDocument();
  });

  it('renders Update Operation button when editing', () => {
    renderWithProviders(<OperationForm existing={createOperation()} />);
    expect(screen.getByText('Update Operation')).toBeInTheDocument();
  });

  it('renders specialty selector', () => {
    renderWithProviders(<OperationForm />);
    expect(screen.getByLabelText('Specialty')).toBeInTheDocument();
    expect(screen.getByText('All specialties (show all fields)')).toBeInTheDocument();
  });

  it('shows specialty options', () => {
    renderWithProviders(<OperationForm />);
    expect(screen.getByText('General Surgery')).toBeInTheDocument();
    expect(screen.getByText('Orthopaedics')).toBeInTheDocument();
  });
});

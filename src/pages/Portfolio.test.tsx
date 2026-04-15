import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/render-with-providers';
import { createOperation } from '../test/factories';

vi.mock('../firebase/analytics', () => ({
  trackPageView: vi.fn(),
  trackPortfolioDateFilterApplied: vi.fn(),
  trackPortfolioDateFilterCleared: vi.fn(),
  trackPortfolioSpecialtyFiltered: vi.fn(),
  trackPortfolioGradeFiltered: vi.fn(),
  trackPortfolioSectionToggled: vi.fn(),
}));

const mockCan = vi.fn(() => true);

vi.mock('../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'paid',
    can: mockCan,
    requiredTier: () => 'free',
    loading: false,
    refreshClaims: vi.fn(),
  })),
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
    allProcedures: [
      { id: 'gs_lap_chole', name: 'Laparoscopic cholecystectomy', category: 'Hepatobiliary', specialty: 'General Surgery', isCustom: false },
    ],
    customTypes: [],
    specialties: ['General Surgery'],
    addProcedureType: vi.fn(),
    removeProcedureType: vi.fn(),
  })),
}));

const { useOperations } = await import('../hooks/useOperations');
const { Portfolio } = await import('./Portfolio');

describe('Portfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCan.mockReturnValue(true);
  });

  it('renders Portfolio Summary heading', () => {
    renderWithProviders(<Portfolio />);
    expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();
  });

  it('shows 0 ops when no operations', () => {
    renderWithProviders(<Portfolio />);
    expect(screen.getByText('0 ops')).toBeInTheDocument();
  });

  it('shows operation count with data', () => {
    vi.mocked(useOperations).mockReturnValue({
      operations: [
        createOperation({ involvement: 'independent' }),
        createOperation({ involvement: 'supervised' }),
        createOperation({ involvement: 'assistant' }),
      ],
      addOperation: vi.fn(),
      updateOperation: vi.fn(),
      deleteOperation: vi.fn(),
    });

    renderWithProviders(<Portfolio />);
    expect(screen.getByText('3 ops')).toBeInTheDocument();
  });

  it('shows KPI cards with Overview section', () => {
    vi.mocked(useOperations).mockReturnValue({
      operations: [createOperation({ involvement: 'independent' })],
      addOperation: vi.fn(),
      updateOperation: vi.fn(),
      deleteOperation: vi.fn(),
    });

    renderWithProviders(<Portfolio />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Total ops')).toBeInTheDocument();
    expect(screen.getByText('% Independent')).toBeInTheDocument();
  });

  it('toggles Overview section', () => {
    vi.mocked(useOperations).mockReturnValue({
      operations: [createOperation()],
      addOperation: vi.fn(),
      updateOperation: vi.fn(),
      deleteOperation: vi.fn(),
    });

    renderWithProviders(<Portfolio />);

    const overviewBtn = screen.getByText('Overview');
    expect(screen.getByText('Total ops')).toBeInTheDocument();

    fireEvent.click(overviewBtn);
    expect(screen.queryByText('Total ops')).not.toBeInTheDocument();
  });

  it('shows upgrade banner when user cannot access portfolio', () => {
    mockCan.mockReturnValue(false);

    renderWithProviders(<Portfolio />);
    expect(screen.getByText('Unlock Portfolio Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Pro/)).toBeInTheDocument();
  });

  it('has date filter inputs', () => {
    renderWithProviders(<Portfolio />);
    expect(screen.getByLabelText('From date')).toBeInTheDocument();
    expect(screen.getByLabelText('To date')).toBeInTheDocument();
  });

  it('filters by date range', () => {
    vi.mocked(useOperations).mockReturnValue({
      operations: [
        createOperation({ date: '2025-01-15' }),
        createOperation({ date: '2025-06-15' }),
        createOperation({ date: '2025-12-15' }),
      ],
      addOperation: vi.fn(),
      updateOperation: vi.fn(),
      deleteOperation: vi.fn(),
    });

    renderWithProviders(<Portfolio />);
    expect(screen.getByText('3 ops')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-06-01' } });
    expect(screen.getByText('2 ops')).toBeInTheDocument();
  });

  it('shows clear button when date filter is active', () => {
    renderWithProviders(<Portfolio />);
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-01-01' } });
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('excludes deleted operations from count', () => {
    vi.mocked(useOperations).mockReturnValue({
      operations: [
        createOperation({ deleted: false }),
        createOperation({ deleted: true }),
      ],
      addOperation: vi.fn(),
      updateOperation: vi.fn(),
      deleteOperation: vi.fn(),
    });

    renderWithProviders(<Portfolio />);
    expect(screen.getByText('1 ops')).toBeInTheDocument();
  });

  it('shows involvement section when operations exist', () => {
    vi.mocked(useOperations).mockReturnValue({
      operations: [
        createOperation({ involvement: 'independent' }),
        createOperation({ involvement: 'supervised' }),
      ],
      addOperation: vi.fn(),
      updateOperation: vi.fn(),
      deleteOperation: vi.fn(),
    });

    renderWithProviders(<Portfolio />);
    expect(screen.getByText('Involvement')).toBeInTheDocument();
    expect(screen.getByText('Independent')).toBeInTheDocument();
    expect(screen.getByText('Supervised')).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioSummary } from './PortfolioSummary';
import { createPortfolioRow } from '../../test/factories';

describe('PortfolioSummary', () => {
  it('shows empty state when no rows', () => {
    render(<PortfolioSummary rows={[]} />);
    expect(screen.getByText(/no operations logged yet/i)).toBeInTheDocument();
  });

  it('renders table with correct column headers', () => {
    const rows = [createPortfolioRow()];
    render(<PortfolioSummary rows={rows} />);

    expect(screen.getByText('Procedure')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Asst')).toBeInTheDocument();
    expect(screen.getByText('Supv')).toBeInTheDocument();
    expect(screen.getByText('Indep')).toBeInTheDocument();
  });

  it('renders specialty and category headers', () => {
    const rows = [
      createPortfolioRow({
        specialty: 'General Surgery',
        category: 'Hepatobiliary',
        procedure: 'Laparoscopic cholecystectomy',
      }),
    ];
    render(<PortfolioSummary rows={rows} />);

    expect(screen.getByText('General Surgery')).toBeInTheDocument();
    expect(screen.getByText('Hepatobiliary')).toBeInTheDocument();
    expect(screen.getByText('Laparoscopic cholecystectomy')).toBeInTheDocument();
  });

  it('shows correct totals for a specialty', () => {
    const rows = [
      createPortfolioRow({
        specialty: 'General Surgery',
        category: 'Hepatobiliary',
        total: 10,
        assistant: 3,
        supervised: 4,
        independent: 3,
      }),
    ];
    render(<PortfolioSummary rows={rows} />);

    // The specialty row should show the total
    const cells = screen.getAllByText('10');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('shows subcategory when present', () => {
    const rows = [
      createPortfolioRow({
        procedure: 'Inguinal hernia repair',
        subcategory: 'Laparoscopic',
      }),
    ];
    render(<PortfolioSummary rows={rows} />);

    expect(screen.getByText('(Laparoscopic)')).toBeInTheDocument();
  });

  it('filters by specialty when filterSpecialty is provided', () => {
    const rows = [
      createPortfolioRow({ specialty: 'General Surgery', procedure: 'Op A' }),
      createPortfolioRow({ specialty: 'Orthopaedics', procedure: 'Op B' }),
    ];
    render(<PortfolioSummary rows={rows} filterSpecialty="General Surgery" />);

    expect(screen.getByText('Op A')).toBeInTheDocument();
    expect(screen.queryByText('Op B')).not.toBeInTheDocument();
  });

  it('shows empty state when filterSpecialty matches nothing', () => {
    const rows = [
      createPortfolioRow({ specialty: 'General Surgery' }),
    ];
    render(<PortfolioSummary rows={rows} filterSpecialty="Neurosurgery" />);

    expect(screen.getByText(/no operations logged yet/i)).toBeInTheDocument();
  });

  it('displays dash for zero counts', () => {
    const rows = [
      createPortfolioRow({
        total: 1,
        assistant: 0,
        supervised: 0,
        independent: 1,
      }),
    ];
    render(<PortfolioSummary rows={rows} />);

    // Zero values should show as '-'
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });
});

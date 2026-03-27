import { useState, useMemo } from 'react';
import { useOperations } from '../hooks/useOperations';
import { usePortfolio } from '../hooks/usePortfolio';
import { useProcedureTypes } from '../hooks/useProcedureTypes';
import { PortfolioSummary } from '../components/portfolio/PortfolioSummary';
import { Calendar } from 'lucide-react';

export function Portfolio() {
  const { operations } = useOperations();
  const { allProcedures, specialties } = useProcedureTypes();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  const availableGrades = useMemo(() => {
    const grades = new Set(operations.filter(op => !op.deleted && op.grade).map(op => op.grade));
    return [...grades].sort();
  }, [operations]);

  const filtered = operations.filter(op => {
    if (dateFrom && op.date < dateFrom) return false;
    if (dateTo && op.date > dateTo) return false;
    if (filterGrade && op.grade !== filterGrade) return false;
    return true;
  });

  const rows = usePortfolio(filtered, allProcedures);
  const totalOps = filtered.filter(op => !op.deleted).length;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Portfolio Summary</h1>

      {/* Date range filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Calendar aria-hidden="true" size={16} className="text-accent shrink-0" />
        <label htmlFor="date-from" className="sr-only">From date</label>
        <input
          id="date-from"
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="input !w-auto text-sm"
        />
        <span className="text-text text-sm shrink-0">to</span>
        <label htmlFor="date-to" className="sr-only">To date</label>
        <input
          id="date-to"
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="input !w-auto text-sm"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-accent hover:underline shrink-0"
            aria-label="Clear date filters"
          >
            Clear
          </button>
        )}
        <span
          aria-label={`${totalOps} operations`}
          className="text-sm font-semibold text-heading ml-auto shrink-0"
        >
          {totalOps} ops
        </span>
      </div>

      {/* Specialty + Grade filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-40">
          <label htmlFor="portfolio-specialty" className="block text-sm font-medium text-text mb-1">
            Specialty
          </label>
          <select
            id="portfolio-specialty"
            value={filterSpecialty}
            onChange={e => setFilterSpecialty(e.target.value)}
            className="input text-sm"
          >
            <option value="">All specialties</option>
            {specialties.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
        {availableGrades.length > 0 && (
          <div className="flex-1 min-w-40">
            <label htmlFor="portfolio-grade" className="block text-sm font-medium text-text mb-1">
              Grade
            </label>
            <select
              id="portfolio-grade"
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="input text-sm"
            >
              <option value="">All grades</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <PortfolioSummary rows={rows} filterSpecialty={filterSpecialty || undefined} />
    </div>
  );
}

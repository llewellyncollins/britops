import { useState } from 'react';
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

  const filtered = operations.filter(op => {
    if (dateFrom && op.date < dateFrom) return false;
    if (dateTo && op.date > dateTo) return false;
    return true;
  });

  const rows = usePortfolio(filtered, allProcedures);
  const totalOps = filtered.filter(op => !op.deleted).length;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Portfolio Summary</h2>

      {/* Date range filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Calendar size={16} className="text-text-muted shrink-0" />
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="input !w-auto text-sm"
        />
        <span className="text-text-muted text-sm shrink-0">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="input !w-auto text-sm"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-primary hover:underline shrink-0"
          >
            Clear
          </button>
        )}
        <span className="text-sm text-text-muted ml-auto shrink-0">{totalOps} ops</span>
      </div>

      {/* Specialty filter */}
      <div className="mb-4">
        <select
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

      <PortfolioSummary rows={rows} filterSpecialty={filterSpecialty || undefined} />
    </div>
  );
}

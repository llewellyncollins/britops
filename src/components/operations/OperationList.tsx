import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OperationCard } from './OperationCard';
import { useProcedureTypes } from '../../hooks/useProcedureTypes';
import type { OperationEntry } from '../../types';
import { Search } from 'lucide-react';

interface Props {
  operations: OperationEntry[];
}

export function OperationList({ operations }: Props) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { allProcedures } = useProcedureTypes();

  const filtered = operations.filter(op => {
    if (!search) return true;
    const q = search.toLowerCase();
    // Search procedure names too
    const procNames = op.procedures
      .map(id => allProcedures.find(p => p.id === id))
      .filter(Boolean)
      .map(p => p!.name.toLowerCase());

    return (
      op.diagnosis?.toLowerCase().includes(q) ||
      op.patientId?.toLowerCase().includes(q) ||
      op.notes?.toLowerCase().includes(q) ||
      procNames.some(name => name.includes(q))
    );
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search aria-hidden="true" size={16} className="absolute left-3 top-3 text-text-muted" />
        <input
          type="text"
          aria-label="Search operations"
          placeholder="Search operations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">No operations found</p>
          <p className="text-sm mt-1">Tap "Log Op" to add your first entry</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(op => (
            <OperationCard
              key={op.id}
              operation={op}
              procedures={allProcedures}
              onClick={() => navigate(`/edit/${op.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

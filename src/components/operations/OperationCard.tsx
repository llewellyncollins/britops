import type { OperationEntry, ProcedureType } from '../../types';
import { Calendar, User, AlertTriangle } from 'lucide-react';

interface Props {
  operation: OperationEntry;
  procedures: ProcedureType[];
  onClick: () => void;
}

const INVOLVEMENT_COLORS = {
  assistant:   'bg-blue-100 text-blue-800',
  supervised:  'bg-amber-100 text-amber-800',
  independent: 'bg-green-100 text-green-800',
};

const INVOLVEMENT_LABELS = {
  assistant:   'Assistant',
  supervised:  'Supervised',
  independent: 'Independent',
};

export function OperationCard({ operation, procedures, onClick }: Props) {
  const procMap = new Map(procedures.map(p => [p.id, p]));
  const procedureNames = operation.procedures
    .map(id => procMap.get(id))
    .filter(Boolean)
    .map(p => p!.subcategory ? `${p!.name} (${p!.subcategory})` : p!.name);

  const hasComplications =
    operation.intraOpComplications && operation.intraOpComplications !== 'nil';

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-surface-raised rounded-xl border border-border hover:border-primary-light transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-text-muted shrink-0" />
            <span className="text-sm text-text-muted">
              {new Date(operation.date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
            {hasComplications && <AlertTriangle size={14} className="text-warning shrink-0" />}
          </div>
          <p className="font-semibold text-sm truncate">
            {procedureNames.join(', ') || 'No procedures'}
          </p>
          {operation.diagnosis && (
            <p className="text-sm text-text-muted truncate mt-0.5">{operation.diagnosis}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${INVOLVEMENT_COLORS[operation.involvement]}`}>
          {INVOLVEMENT_LABELS[operation.involvement]}
        </span>
      </div>
      {operation.patientId && (
        <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
          <User size={12} />
          <span>{operation.patientId}</span>
        </div>
      )}
    </button>
  );
}

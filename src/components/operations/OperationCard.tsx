import type { OperationEntry, ProcedureType } from '../../types';
import { Calendar, User, AlertTriangle, Clock, CheckCheck, CloudUpload } from 'lucide-react';

interface Props {
  operation: OperationEntry;
  procedures: ProcedureType[];
  onClick: () => void;
  onMarkFollowUpDone?: () => void;
}

const INVOLVEMENT_COLORS = {
  assistant:   'bg-blue-50 text-primary',
  supervised:  'bg-amber-50 text-accent-dark',
  independent: 'bg-emerald-50 text-success',
};

const INVOLVEMENT_LABELS = {
  assistant:   'Assistant',
  supervised:  'Supervised',
  independent: 'Independent',
};

export function OperationCard({ operation, procedures, onClick, onMarkFollowUpDone }: Props) {
  const procMap = new Map(procedures.map(p => [p.id, p]));
  const procedureNames = operation.procedures
    .map(id => procMap.get(id))
    .filter(Boolean)
    .map(p => p!.subcategory ? `${p!.name} (${p!.subcategory})` : p!.name);

  const hasComplications =
    operation.intraOpComplications && operation.intraOpComplications !== 'nil';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="w-full text-left p-4 bg-surface-raised rounded-xl border border-border hover:border-primary-light transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Calendar aria-hidden="true" size={14} className="text-text-muted shrink-0" />
            <span className="text-sm text-text-muted">
              {new Date(operation.date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
            {hasComplications && (
              <>
                <AlertTriangle aria-hidden="true" size={14} className="text-warning shrink-0" />
                <span className="sr-only">Has intraoperative complications</span>
              </>
            )}
            {operation.followUp && (
              <>
                <Clock aria-hidden="true" size={14} className="text-accent shrink-0" />
                <span className="sr-only">Requires follow-up</span>
              </>
            )}
            {operation.syncPending && (
              <>
                <CloudUpload aria-hidden="true" size={14} className="text-text-muted shrink-0" />
                <span className="sr-only">Pending sync</span>
              </>
            )}
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
          <User aria-hidden="true" size={12} />
          <span>{operation.patientId}</span>
        </div>
      )}
      {operation.followUp && onMarkFollowUpDone && (
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs font-medium text-accent flex items-center gap-1">
            <Clock size={12} aria-hidden="true" />
            Follow-up pending
          </span>
          <button
            onClick={e => { e.stopPropagation(); onMarkFollowUpDone(); }}
            className="flex items-center gap-1 text-xs font-medium text-success hover:text-success/80 transition-colors"
            aria-label="Mark follow-up as done"
          >
            <CheckCheck size={12} aria-hidden="true" />
            Mark done
          </button>
        </div>
      )}
    </div>
  );
}

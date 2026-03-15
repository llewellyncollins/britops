import { useMemo } from 'react';
import type { OperationEntry, PortfolioRow, ProcedureType } from '../types';

/**
 * Aggregates operations into portfolio summary rows.
 * Only returns rows for procedures that have been used at least once.
 */
export function usePortfolio(
  operations: OperationEntry[],
  procedures: ProcedureType[],
): PortfolioRow[] {
  return useMemo(() => {
    // Build a lookup map: id → ProcedureType
    const procMap = new Map(procedures.map(p => [p.id, p]));

    // Count per procedure id
    const counts = new Map<string, PortfolioRow>();

    for (const op of operations) {
      if (op.deleted) continue;
      for (const procId of op.procedures) {
        const proc = procMap.get(procId);
        if (!proc) continue;

        if (!counts.has(procId)) {
          counts.set(procId, {
            procedureId: proc.id,
            procedure: proc.name,
            category: proc.category,
            subcategory: proc.subcategory,
            specialty: proc.specialty,
            total: 0,
            assistant: 0,
            supervised: 0,
            independent: 0,
          });
        }

        const row = counts.get(procId)!;
        row.total++;
        if (op.involvement === 'assistant') row.assistant++;
        else if (op.involvement === 'supervised') row.supervised++;
        else if (op.involvement === 'independent') row.independent++;
      }
    }

    // Sort by specialty → category → procedure name
    return [...counts.values()].sort((a, b) => {
      if (a.specialty !== b.specialty) return a.specialty.localeCompare(b.specialty);
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.procedure.localeCompare(b.procedure);
    });
  }, [operations, procedures]);
}

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { DEFAULT_PROCEDURES } from '../data/procedures';
import type { ProcedureType } from '../types';

/**
 * Returns the merged list of all procedure types:
 * - DEFAULT_PROCEDURES (built-in, isCustom: false)
 * - User-added entries from IndexedDB (isCustom: true)
 * and provides CRUD helpers for custom types.
 */
export function useProcedureTypes() {
  const customTypes = useLiveQuery(() => db.procedureTypes.toArray(), [], []);

  // Merge: defaults first, then custom additions (custom can shadow defaults by id)
  const allProcedures: ProcedureType[] = (() => {
    const customIds = new Set((customTypes ?? []).map(p => p.id));
    const defaults = DEFAULT_PROCEDURES.filter(p => !customIds.has(p.id));
    return [...defaults, ...(customTypes ?? [])];
  })();

  async function addProcedureType(p: Omit<ProcedureType, 'isCustom'>): Promise<void> {
    await db.procedureTypes.put({ ...p, isCustom: true });
  }

  async function removeProcedureType(id: string): Promise<void> {
    // Only allow removing custom types
    const existing = await db.procedureTypes.get(id);
    if (existing?.isCustom) {
      await db.procedureTypes.delete(id);
    }
  }

  async function updateProcedureType(p: ProcedureType): Promise<void> {
    if (p.isCustom) {
      await db.procedureTypes.put(p);
    }
  }

  /** Disable a default procedure by adding a 'hidden' override record */
  async function hideProcedureType(id: string): Promise<void> {
    const def = DEFAULT_PROCEDURES.find(p => p.id === id);
    if (def) {
      // Store a hidden marker — same id with a special flag
      await db.procedureTypes.put({ ...def, isCustom: true, name: `__hidden__${def.name}` });
    }
  }

  // Filter out hidden entries for display
  const visibleProcedures = allProcedures.filter(p => !p.name.startsWith('__hidden__'));

  const specialties = [...new Set(visibleProcedures.map(p => p.specialty))].sort();

  return {
    allProcedures: visibleProcedures,
    customTypes: (customTypes ?? []).filter(p => !p.name.startsWith('__hidden__')),
    specialties,
    addProcedureType,
    removeProcedureType,
    updateProcedureType,
    hideProcedureType,
  };
}

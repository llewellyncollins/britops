import Dexie, { type EntityTable } from 'dexie';
import type { OperationEntry, ProcedureType } from '../types';

const db = new Dexie('BritOpsDB') as Dexie & {
  operations: EntityTable<OperationEntry, 'id'>;
  procedureTypes: EntityTable<ProcedureType, 'id'>;
};

db.version(1).stores({
  operations: 'id, userId, date, *procedures, involvement, deleted, updatedAt',
});

// v2: adds custom procedure types table
db.version(2).stores({
  operations: 'id, userId, date, *procedures, involvement, deleted, updatedAt',
  procedureTypes: 'id, specialty, category, isCustom',
});

export { db };

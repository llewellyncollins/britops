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

// v3: adds syncPending index for efficient pending-sync queries
db.version(3)
  .stores({
    operations: 'id, userId, date, *procedures, involvement, deleted, updatedAt, syncPending',
    procedureTypes: 'id, specialty, category, isCustom',
  })
  .upgrade(tx =>
    tx.table('operations').toCollection().modify({ syncPending: true }),
  );

export { db };

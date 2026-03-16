import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/dexie';
import { useAuth } from './useAuth';
import type { OperationEntry } from '../types';

export function useOperations() {
  const { user } = useAuth();
  const userId = user?.uid ?? 'local-user';
  const operations = useLiveQuery(
    async () => {
      const all = await db.operations.toArray();
      return all
        .filter(op => !op.deleted)
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    []
  );

  async function addOperation(data: Omit<OperationEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt'>) {
    const now = new Date().toISOString();
    const entry: OperationEntry = {
      ...data,
      id: uuidv4(),
      userId,
      createdAt: now,
      updatedAt: now,
      deleted: false,
      deletedAt: null,
    };
    await db.operations.add(entry);
    return entry;
  }

  async function updateOperation(id: string, data: Partial<OperationEntry>) {
    await db.operations.update(id, { ...data, updatedAt: new Date().toISOString() });
  }

  async function deleteOperation(id: string) {
    const now = new Date().toISOString();
    await db.operations.update(id, { deleted: true, deletedAt: now, updatedAt: now });
  }

  return { operations: operations ?? [], addOperation, updateOperation, deleteOperation };
}

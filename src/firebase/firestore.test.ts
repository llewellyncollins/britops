import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db/dexie';
import { createOperation } from '../test/factories';

// Mock Firebase SDK — we're testing the sync logic, not Firebase calls
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('./config', () => ({
  isConfigured: true,
  firestore: {},
  app: null,
  auth: null,
}));

const { syncFromFirestore, syncProcedureTypesFromFirestore, migrateLocalOps } =
  await import('./firestore');

describe('syncFromFirestore', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
  });

  it('adds a remote entry that does not exist locally', async () => {
    const remote = createOperation({ id: 'remote-1', userId: 'user-1' });
    await syncFromFirestore([remote]);

    const local = await db.operations.get('remote-1');
    expect(local).toBeDefined();
    expect(local?.diagnosis).toBe(remote.diagnosis);
  });

  it('overwrites local entry when remote has newer updatedAt', async () => {
    const local = createOperation({
      id: 'shared-1',
      userId: 'user-1',
      diagnosis: 'Local version',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    await db.operations.add(local);

    const remote = createOperation({
      id: 'shared-1',
      userId: 'user-1',
      diagnosis: 'Remote version',
      updatedAt: '2025-06-01T00:00:00.000Z',
    });

    await syncFromFirestore([remote]);

    const result = await db.operations.get('shared-1');
    expect(result?.diagnosis).toBe('Remote version');
  });

  it('keeps local entry when local has newer updatedAt', async () => {
    const local = createOperation({
      id: 'shared-2',
      userId: 'user-1',
      diagnosis: 'Local version',
      updatedAt: '2025-06-01T00:00:00.000Z',
    });
    await db.operations.add(local);

    const remote = createOperation({
      id: 'shared-2',
      userId: 'user-1',
      diagnosis: 'Remote version',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });

    await syncFromFirestore([remote]);

    const result = await db.operations.get('shared-2');
    expect(result?.diagnosis).toBe('Local version');
  });

  it('handles multiple remote entries', async () => {
    const remotes = [
      createOperation({ id: 'batch-1', userId: 'user-1' }),
      createOperation({ id: 'batch-2', userId: 'user-1' }),
      createOperation({ id: 'batch-3', userId: 'user-1' }),
    ];

    await syncFromFirestore(remotes);

    const all = await db.operations.toArray();
    expect(all).toHaveLength(3);
  });
});

describe('syncProcedureTypesFromFirestore', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
  });

  it('stores custom procedure types from remote', async () => {
    const remoteTypes = [
      { id: 'custom_1', name: 'Remote Proc', category: 'Test', specialty: 'General Surgery', isCustom: true as const },
    ];

    await syncProcedureTypesFromFirestore(remoteTypes);

    const local = await db.procedureTypes.get('custom_1');
    expect(local).toBeDefined();
    expect(local?.name).toBe('Remote Proc');
  });

  it('skips non-custom procedure types', async () => {
    const remoteTypes = [
      { id: 'default_1', name: 'Default Proc', category: 'Test', specialty: 'General Surgery', isCustom: false as const },
    ];

    await syncProcedureTypesFromFirestore(remoteTypes);

    const local = await db.procedureTypes.get('default_1');
    expect(local).toBeUndefined();
  });
});

describe('migrateLocalOps', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
  });

  it('re-tags local-user operations with real UID', async () => {
    await db.operations.bulkAdd([
      createOperation({ id: 'local-op-1', userId: 'local-user' }),
      createOperation({ id: 'local-op-2', userId: 'local-user' }),
    ]);

    await migrateLocalOps('real-uid-123');

    const all = await db.operations.toArray();
    expect(all.every(op => op.userId === 'real-uid-123')).toBe(true);
  });

  it('does nothing when no local-user operations exist', async () => {
    await db.operations.add(
      createOperation({ id: 'already-tagged', userId: 'existing-user' }),
    );

    await migrateLocalOps('real-uid-123');

    const op = await db.operations.get('already-tagged');
    expect(op?.userId).toBe('existing-user');
  });
});

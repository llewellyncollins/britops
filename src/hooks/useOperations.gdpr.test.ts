import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { db } from '../db/dexie';
import { createOperation } from '../test/factories';

vi.mock('../firebase/auth', () => ({
  onAuthChange: vi.fn((cb: (user: unknown) => void) => {
    cb({ uid: 'test-user', email: 'test@example.com' });
    return () => {};
  }),
}));

vi.mock('../firebase/config', () => ({
  isConfigured: false,
  app: null,
  auth: null,
  firestore: null,
}));

const { useOperations } = await import('./useOperations');

describe('useOperations — GDPR compliance', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
  });

  it('addOperation sets deletedAt to null', async () => {
    const { result } = renderHook(() => useOperations());

    await act(async () => {
      await result.current.addOperation({
        date: '2025-03-15',
        hospital: '',
        grade: '',
        patientId: 'PT001',
        chemotherapy: '',
        diagnosis: 'Test',
        procedures: ['gs_lap_chole'],
        involvement: 'independent',
        otherDetails: '',
        intraOpComplications: '',
        postOpComplications: '',
        histology: '',
        followUp: false,
        complexityScore: null,
        pci: null,
        discussedMDT: false,
        notes: '',
      });
    });

    const all = await db.operations.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].deletedAt).toBeNull();
    expect(all[0].deleted).toBe(false);
  });

  it('deleteOperation sets deletedAt to an ISO timestamp', async () => {
    const op = createOperation({ userId: 'test-user' });
    await db.operations.add(op);

    const { result } = renderHook(() => useOperations());

    const before = new Date().toISOString();

    await act(async () => {
      await result.current.deleteOperation(op.id);
    });

    const after = new Date().toISOString();
    const deleted = await db.operations.get(op.id);

    expect(deleted?.deleted).toBe(true);
    expect(deleted?.deletedAt).toBeTruthy();
    // deletedAt should be between before and after
    expect(deleted!.deletedAt! >= before).toBe(true);
    expect(deleted!.deletedAt! <= after).toBe(true);
  });

  it('deleteOperation sets deletedAt as valid ISO 8601 string', async () => {
    const op = createOperation({ userId: 'test-user' });
    await db.operations.add(op);

    const { result } = renderHook(() => useOperations());

    await act(async () => {
      await result.current.deleteOperation(op.id);
    });

    const deleted = await db.operations.get(op.id);
    // Should parse as a valid date
    const parsed = new Date(deleted!.deletedAt!);
    expect(parsed.getTime()).not.toBeNaN();
  });

  it('soft-deleted operations with deletedAt are excluded from the list', async () => {
    const now = new Date().toISOString();
    await db.operations.bulkAdd([
      createOperation({ userId: 'test-user', deleted: false, deletedAt: null, diagnosis: 'Active' }),
      createOperation({ userId: 'test-user', deleted: true, deletedAt: now, diagnosis: 'Deleted' }),
    ]);

    const { result } = renderHook(() => useOperations());

    await waitFor(() => {
      expect(result.current.operations).toHaveLength(1);
      expect(result.current.operations[0].diagnosis).toBe('Active');
    });
  });
});

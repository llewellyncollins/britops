import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { db } from '../db/dexie';
import { DEFAULT_PROCEDURES } from '../data/procedures';

// Mock Firebase so it doesn't initialize
vi.mock('../firebase/auth', () => ({
  onAuthChange: vi.fn((cb: (user: unknown) => void) => {
    cb(null);
    return () => {};
  }),
}));

vi.mock('../firebase/config', () => ({
  isConfigured: false,
  app: null,
  auth: null,
  firestore: null,
}));

const { useProcedureTypes } = await import('./useProcedureTypes');

describe('useProcedureTypes', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
  });

  it('returns all default procedures when no custom types exist', async () => {
    const { result } = renderHook(() => useProcedureTypes());

    await waitFor(() => {
      expect(result.current.allProcedures.length).toBe(DEFAULT_PROCEDURES.length);
    });
  });

  it('includes custom procedure after addProcedureType', async () => {
    const { result } = renderHook(() => useProcedureTypes());

    await act(async () => {
      await result.current.addProcedureType({
        id: 'custom_test_1',
        name: 'My Custom Op',
        category: 'Custom Cat',
        specialty: 'General Surgery',
      });
    });

    await waitFor(() => {
      const custom = result.current.allProcedures.find(p => p.id === 'custom_test_1');
      expect(custom).toBeDefined();
      expect(custom?.name).toBe('My Custom Op');
      expect(custom?.isCustom).toBe(true);
    });
  });

  it('custom type with same ID as default shadows the default', async () => {
    const { result } = renderHook(() => useProcedureTypes());

    await act(async () => {
      await result.current.addProcedureType({
        id: 'gs_lap_chole', // same as a default
        name: 'Custom Lap Chole',
        category: 'Custom',
        specialty: 'General Surgery',
      });
    });

    await waitFor(() => {
      const matches = result.current.allProcedures.filter(p => p.id === 'gs_lap_chole');
      expect(matches).toHaveLength(1);
      expect(matches[0].name).toBe('Custom Lap Chole');
    });
  });

  it('removeProcedureType removes custom types', async () => {
    const { result } = renderHook(() => useProcedureTypes());

    await act(async () => {
      await result.current.addProcedureType({
        id: 'custom_removable',
        name: 'Removable Op',
        category: 'Test',
        specialty: 'General Surgery',
      });
    });

    await waitFor(() => {
      expect(result.current.allProcedures.find(p => p.id === 'custom_removable')).toBeDefined();
    });

    await act(async () => {
      await result.current.removeProcedureType('custom_removable');
    });

    await waitFor(() => {
      expect(result.current.allProcedures.find(p => p.id === 'custom_removable')).toBeUndefined();
    });
  });

  it('hideProcedureType hides a default procedure', async () => {
    const { result } = renderHook(() => useProcedureTypes());

    const initialCount = DEFAULT_PROCEDURES.length;

    await act(async () => {
      await result.current.hideProcedureType('gs_lap_chole');
    });

    await waitFor(() => {
      // The hidden procedure should not appear in allProcedures
      expect(result.current.allProcedures.find(p => p.id === 'gs_lap_chole')).toBeUndefined();
      // Total count should be one less
      expect(result.current.allProcedures.length).toBe(initialCount - 1);
    });
  });

  it('specialties list is derived from visible procedures', async () => {
    const { result } = renderHook(() => useProcedureTypes());

    await waitFor(() => {
      expect(result.current.specialties).toContain('General Surgery');
      expect(result.current.specialties).toContain('Orthopaedics');
      expect(result.current.specialties.length).toBe(13);
    });
  });

  it('customTypes list only includes non-hidden custom entries', async () => {
    const { result } = renderHook(() => useProcedureTypes());

    await act(async () => {
      await result.current.addProcedureType({
        id: 'custom_visible',
        name: 'Visible Custom',
        category: 'Test',
        specialty: 'General Surgery',
      });
    });

    await waitFor(() => {
      expect(result.current.customTypes.find(p => p.id === 'custom_visible')).toBeDefined();
      // Hidden entries (name starts with __hidden__) should not appear in customTypes
      expect(result.current.customTypes.every(p => !p.name.startsWith('__hidden__'))).toBe(true);
    });
  });
});

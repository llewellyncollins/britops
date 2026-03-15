import { vi } from 'vitest';

export const mockPushToFirestore = vi.fn().mockResolvedValue(undefined);
export const mockPushAllToFirestore = vi.fn().mockResolvedValue(undefined);
export const mockSubscribeToFirestore = vi.fn(() => vi.fn());
export const mockSyncFromFirestore = vi.fn().mockResolvedValue(undefined);
export const mockMigrateLocalOps = vi.fn().mockResolvedValue(undefined);
export const mockPushProcedureTypeToFirestore = vi.fn().mockResolvedValue(undefined);
export const mockDeleteProcedureTypeFromFirestore = vi.fn().mockResolvedValue(undefined);
export const mockSubscribeToProcedureTypes = vi.fn(() => vi.fn());
export const mockSyncProcedureTypesFromFirestore = vi.fn().mockResolvedValue(undefined);

/**
 * Call this in your test file to set up the Firebase Firestore mock.
 *
 * Usage:
 *   vi.mock('../../firebase/firestore', () => setupFirestoreMock());
 */
export function setupFirestoreMock() {
  return {
    pushToFirestore: mockPushToFirestore,
    pushAllToFirestore: mockPushAllToFirestore,
    subscribeToFirestore: mockSubscribeToFirestore,
    syncFromFirestore: mockSyncFromFirestore,
    migrateLocalOps: mockMigrateLocalOps,
    pushProcedureTypeToFirestore: mockPushProcedureTypeToFirestore,
    deleteProcedureTypeFromFirestore: mockDeleteProcedureTypeFromFirestore,
    subscribeToProcedureTypes: mockSubscribeToProcedureTypes,
    syncProcedureTypesFromFirestore: mockSyncProcedureTypesFromFirestore,
  };
}

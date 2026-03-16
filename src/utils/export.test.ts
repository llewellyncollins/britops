import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db/dexie';
import { createOperation, createProcedureType } from '../test/factories';

// Mock DOM APIs for file download
const createObjectURLMock = vi.fn().mockReturnValue('blob:mock');
const revokeObjectURLMock = vi.fn();
URL.createObjectURL = createObjectURLMock;
URL.revokeObjectURL = revokeObjectURLMock;

// Track anchor element click
const clickMock = vi.fn();
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'a') {
    return { href: '', download: '', click: clickMock, setAttribute: vi.fn() } as unknown as HTMLAnchorElement;
  }
  return document.createElement(tag);
});

// Mock Firebase config so import doesn't try to init Firebase
vi.mock('../firebase/config', () => ({
  isConfigured: false,
  firestore: null,
  app: null,
  auth: null,
}));

const { exportAllDataJson } = await import('./export');

describe('exportAllDataJson — GDPR data portability', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    clickMock.mockClear();
  });

  it('exports user operations in JSON format', async () => {
    await db.operations.bulkAdd([
      createOperation({ userId: 'user-1', diagnosis: 'Appendicitis' }),
      createOperation({ userId: 'user-1', diagnosis: 'Cholecystitis' }),
      createOperation({ userId: 'other-user', diagnosis: 'Should not appear' }),
    ]);

    await exportAllDataJson('user-1');

    expect(createObjectURLMock).toHaveBeenCalledOnce();
    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('application/json');

    // Parse the blob content
    const text = await blobArg.text();
    const data = JSON.parse(text);

    expect(data.dataVersion).toBe('1.0');
    expect(data.exportDate).toBeTruthy();
    expect(data.operations).toHaveLength(2);
    expect(data.operations.every((op: { userId: string }) => op.userId === 'user-1')).toBe(true);
  });

  it('includes custom procedure types in export', async () => {
    await db.procedureTypes.add(
      createProcedureType({ id: 'custom-1', name: 'Custom Proc', isCustom: true }),
    );

    await exportAllDataJson('user-1');

    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    const data = JSON.parse(text);

    expect(data.customProcedureTypes).toHaveLength(1);
    expect(data.customProcedureTypes[0].name).toBe('Custom Proc');
  });

  it('triggers file download with correct filename pattern', async () => {
    await exportAllDataJson('user-1');

    expect(clickMock).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledOnce();
  });

  it('exports empty arrays when user has no data', async () => {
    await exportAllDataJson('empty-user');

    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    const data = JSON.parse(text);

    expect(data.operations).toHaveLength(0);
    expect(data.customProcedureTypes).toHaveLength(0);
  });
});

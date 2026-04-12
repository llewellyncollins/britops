import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { db } from '../db/dexie';
import { createOperation } from '../test/factories';
import type { UserTier } from '../types';

// ── Firebase SDK mock ────────────────────────────────────────────────────────
// We mock only the *Firebase SDK*, not our firestore.ts wrapper, so the
// real pushToFirestore / syncFromFirestore / isSyncingFromFirestore flag
// all run normally. This gives us end-to-end coverage of the sync flow.
const setDocMock = vi.fn().mockResolvedValue(undefined);
const deleteDocMock = vi.fn().mockResolvedValue(undefined);
const onSnapshotMock = vi.fn(() => vi.fn());
const getDocMock = vi.fn().mockResolvedValue({ exists: () => false });
const getDocsMock = vi.fn().mockResolvedValue({ docs: [] });

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_f: unknown, _c: string, id: string) => ({ id })),
  setDoc: setDocMock,
  deleteDoc: deleteDocMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: onSnapshotMock,
}));

vi.mock('../firebase/config', () => ({
  isConfigured: true,
  firestore: {},
  app: null,
  auth: null,
}));

vi.mock('../firebase/analytics', () => ({
  trackOperationLogged: vi.fn(),
  trackOperationUpdated: vi.fn(),
  trackOperationDeleted: vi.fn(),
  setAnalyticsUserProperties: vi.fn(),
}));

// Import AFTER mocks so module-level code uses the mocked SDK
const { useSync, pushPendingOps } = await import('./useSync');
const firestoreMod = await import('../firebase/firestore');

const mockUser = { uid: 'test-uid', email: 'test@example.com' } as User;

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value,
    writable: true,
    configurable: true,
  });
}

/** Return only the setDoc calls that look like operation pushes
 *  (vs. user settings or other collections). */
function opPushCalls() {
  return setDocMock.mock.calls.filter(call => {
    const data = call[1] as Record<string, unknown> | undefined;
    return !!data && 'date' in data && 'procedures' in data;
  });
}

/** Wait until N operation pushes have happened. */
async function waitForPushes(n: number) {
  await waitFor(() => {
    expect(opPushCalls().length).toBe(n);
  });
}

describe('useSync — online push on create', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await db.operations.clear();
    setOnline(true);
    setDocMock.mockClear();
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await db.operations.clear();
  });

  it('pushes new operation to Firestore and flips syncPending to false', async () => {
    const { unmount } = renderHook(() => useSync(mockUser, 'paid'));

    // Allow effects to run and hooks to register, and Effect 2 (migrate + pushPending) to fully settle
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });
    setDocMock.mockClear();

    const op = createOperation({
      id: 'op-create-1',
      userId: mockUser.uid,
      syncPending: true,
    });
    await db.operations.add(op);

    await waitForPushes(1);

    // Verify op was pushed
    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'op-create-1' }),
      expect.objectContaining({ id: 'op-create-1' }),
      { merge: true },
    );

    // syncPending should flip to false
    await waitFor(async () => {
      const stored = await db.operations.get('op-create-1');
      expect(stored?.syncPending).toBe(false);
    });

    unmount();
  });

  it('strips syncPending field from Firestore payload', async () => {
    renderHook(() => useSync(mockUser, 'paid'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    const op = createOperation({
      id: 'op-strip',
      userId: mockUser.uid,
      syncPending: true,
    });
    await db.operations.add(op);

    await waitForPushes(1);

    const writtenData = opPushCalls()[0][1] as Record<string, unknown>;
    expect(writtenData).not.toHaveProperty('syncPending');
    expect(writtenData.id).toBe('op-strip');
  });

  it('does not push when user is not signed in', async () => {
    renderHook(() => useSync(null, 'free'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    const op = createOperation({
      id: 'op-no-user',
      userId: 'local-user',
      syncPending: true,
    });
    await db.operations.add(op);

    await new Promise(r => setTimeout(r, 50));

    expect(opPushCalls()).toHaveLength(0);
    const stored = await db.operations.get('op-no-user');
    expect(stored?.syncPending).toBe(true);
  });
});

describe('useSync — offline behaviour', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await db.operations.clear();
    setDocMock.mockClear();
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    setOnline(true);
    await db.operations.clear();
  });

  it('does not attempt push when offline — syncPending stays true', async () => {
    setOnline(false);
    renderHook(() => useSync(mockUser, 'paid'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    const op = createOperation({
      id: 'op-offline',
      userId: mockUser.uid,
      syncPending: true,
    });
    await db.operations.add(op);

    await new Promise(r => setTimeout(r, 50));

    expect(opPushCalls()).toHaveLength(0);
    const stored = await db.operations.get('op-offline');
    expect(stored?.syncPending).toBe(true);
  });

  it('pushes all pending ops when online event fires', async () => {
    setOnline(false);
    renderHook(() => useSync(mockUser, 'paid'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    await db.operations.bulkAdd([
      createOperation({ id: 'recov-1', userId: mockUser.uid, syncPending: true }),
      createOperation({ id: 'recov-2', userId: mockUser.uid, syncPending: true }),
      createOperation({ id: 'recov-3', userId: mockUser.uid, syncPending: false }), // already synced
      createOperation({ id: 'recov-4', userId: 'other-user', syncPending: true }),   // not our user
    ]);

    await new Promise(r => setTimeout(r, 50));
    expect(opPushCalls()).toHaveLength(0);

    // Reconnect
    setOnline(true);
    window.dispatchEvent(new Event('online'));

    await waitForPushes(2);

    const pushedIds = opPushCalls().map(
      c => (c[1] as { id: string }).id,
    ).sort();
    expect(pushedIds).toEqual(['recov-1', 'recov-2']);

    // syncPending flipped for recovered ops
    const r1 = await db.operations.get('recov-1');
    const r2 = await db.operations.get('recov-2');
    expect(r1?.syncPending).toBe(false);
    expect(r2?.syncPending).toBe(false);

    // Already-synced op untouched
    const r3 = await db.operations.get('recov-3');
    expect(r3?.syncPending).toBe(false);

    // Other user's op untouched
    const r4 = await db.operations.get('recov-4');
    expect(r4?.syncPending).toBe(true);
  });
});

describe('useSync — push failure & retry', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await db.operations.clear();
    setOnline(true);
    setDocMock.mockClear();
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await db.operations.clear();
  });

  it('leaves syncPending: true when push fails', async () => {
    // Fail the FIRST operation push (filter out settings pushes)
    let opFailArmed = true;
    setDocMock.mockImplementation(async (_ref, data) => {
      if (
        opFailArmed
        && data
        && typeof data === 'object'
        && 'date' in data
        && 'procedures' in data
      ) {
        opFailArmed = false;
        throw new Error('Network error');
      }
      return undefined;
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useSync(mockUser, 'paid'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    const op = createOperation({
      id: 'op-fail',
      userId: mockUser.uid,
      syncPending: true,
    });
    await db.operations.add(op);

    await waitForPushes(1); // attempt was made
    await new Promise(r => setTimeout(r, 20)); // let catch settle

    const stored = await db.operations.get('op-fail');
    expect(stored?.syncPending).toBe(true); // still pending

    errSpy.mockRestore();
  });

  it('recovers failed ops on subsequent online event', async () => {
    // Fail the first op push only (let settings pushes through)
    let opFailArmed = true;
    setDocMock.mockImplementation(async (_ref, data) => {
      if (
        opFailArmed
        && data
        && typeof data === 'object'
        && 'date' in data
        && 'procedures' in data
      ) {
        opFailArmed = false;
        throw new Error('Network error');
      }
      return undefined;
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useSync(mockUser, 'paid'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    const op = createOperation({
      id: 'op-retry',
      userId: mockUser.uid,
      syncPending: true,
    });
    await db.operations.add(op);
    await waitForPushes(1);
    await new Promise(r => setTimeout(r, 20));

    // Still pending after failure
    let stored = await db.operations.get('op-retry');
    expect(stored?.syncPending).toBe(true);

    // Trigger online recovery (setDoc now succeeds)
    window.dispatchEvent(new Event('online'));

    await waitForPushes(2);
    await waitFor(async () => {
      const s = await db.operations.get('op-retry');
      expect(s?.syncPending).toBe(false);
    });

    stored = await db.operations.get('op-retry');
    expect(stored?.syncPending).toBe(false);

    errSpy.mockRestore();
  });
});

describe('useSync — updates', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await db.operations.clear();
    setOnline(true);
    setDocMock.mockClear();
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await db.operations.clear();
  });

  it('pushes update with merged data', async () => {
    const op = createOperation({
      id: 'op-upd',
      userId: mockUser.uid,
      diagnosis: 'Original',
      syncPending: false,
    });
    await db.operations.add(op);

    renderHook(() => useSync(mockUser, 'paid'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    await db.operations.update('op-upd', {
      diagnosis: 'Updated',
      updatedAt: '2025-12-01T00:00:00.000Z',
      syncPending: true,
    });

    await waitForPushes(1);

    const pushedOp = opPushCalls()[0][1] as { diagnosis: string };
    expect(pushedOp.diagnosis).toBe('Updated');

    await waitFor(async () => {
      const stored = await db.operations.get('op-upd');
      expect(stored?.syncPending).toBe(false);
    });
  });

  it('does NOT re-push on bookkeeping-only syncPending update (loop prevention)', async () => {
    renderHook(() => useSync(mockUser, 'paid'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    // Add op (triggers one push)
    const op = createOperation({
      id: 'op-book',
      userId: mockUser.uid,
      syncPending: true,
    });
    await db.operations.add(op);
    await waitForPushes(1);

    const baselineOpPushes = opPushCalls().length;

    // Internal bookkeeping update
    await db.operations.update('op-book', { syncPending: false });
    await new Promise(r => setTimeout(r, 30));

    expect(opPushCalls().length).toBe(baselineOpPushes);
  });
});

describe('useSync — isSyncingFromFirestore loop prevention', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await db.operations.clear();
    setOnline(true);
    setDocMock.mockClear();
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await db.operations.clear();
  });

  it('does not push ops written by syncFromFirestore (remote → local)', async () => {
    renderHook(() => useSync(mockUser, 'paid'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();

    // Simulate remote snapshot arriving
    const remote = createOperation({
      id: 'op-remote',
      userId: mockUser.uid,
      diagnosis: 'From Firestore',
    });
    await firestoreMod.syncFromFirestore([remote]);

    await new Promise(r => setTimeout(r, 50));

    // Remote ops should NOT trigger a re-push
    expect(opPushCalls()).toHaveLength(0);

    // Remote op was stored with syncPending: false
    const stored = await db.operations.get('op-remote');
    expect(stored).toBeDefined();
    expect(stored?.syncPending).toBe(false);
  });

  it('clears isSyncingFromFirestore flag after sync completes', async () => {
    const remote = createOperation({ id: 'flag-check', userId: mockUser.uid });
    await firestoreMod.syncFromFirestore([remote]);
    expect(firestoreMod.isSyncingFromFirestore).toBe(false);
  });
});

describe('useSync — sign-in recovery', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await db.operations.clear();
    setOnline(true);
    setDocMock.mockClear();
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await db.operations.clear();
  });

  it('pushes pending ops when user transitions from null to signed-in', async () => {
    // Seed ops while "signed out"
    await db.operations.bulkAdd([
      createOperation({
        id: 'signin-pending-1',
        userId: mockUser.uid,
        syncPending: true,
      }),
      createOperation({
        id: 'signin-synced',
        userId: mockUser.uid,
        syncPending: false,
      }),
    ]);

    const { rerender } = renderHook(
      ({ user, tier }: { user: User | null; tier: 'free' | 'signed-in' | 'paid' }) => useSync(user, tier),
      { initialProps: { user: null as User | null, tier: 'free' as UserTier } },
    );

    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    setDocMock.mockClear();
    expect(opPushCalls()).toHaveLength(0);

    // Sign in with paid tier
    rerender({ user: mockUser, tier: 'paid' });

    await waitForPushes(1);

    const pushedIds = opPushCalls().map(
      c => (c[1] as { id: string }).id,
    );
    expect(pushedIds).toContain('signin-pending-1');
    expect(pushedIds).not.toContain('signin-synced');
  });
});

describe('pushPendingOps — race guard', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await db.operations.clear();
    setDocMock.mockClear();
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await db.operations.clear();
  });

  it('does NOT flip syncPending to false if op was modified during the push', async () => {
    const initialOp = createOperation({
      id: 'race-1',
      userId: mockUser.uid,
      syncPending: true,
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    await db.operations.add(initialOp);

    // Mock push to bump the updatedAt mid-flight, simulating a concurrent edit
    setDocMock.mockImplementationOnce(async () => {
      await db.operations.update('race-1', {
        updatedAt: '2025-02-01T00:00:00.000Z',
        syncPending: true,
      });
    });

    await pushPendingOps(mockUser.uid);

    const stored = await db.operations.get('race-1');
    // Race guard detects newer updatedAt → syncPending NOT flipped
    expect(stored?.syncPending).toBe(true);
    expect(stored?.updatedAt).toBe('2025-02-01T00:00:00.000Z');
  });

  it('flips syncPending to false on a successful uncontested push', async () => {
    const op = createOperation({
      id: 'race-clean',
      userId: mockUser.uid,
      syncPending: true,
    });
    await db.operations.add(op);

    await pushPendingOps(mockUser.uid);

    const stored = await db.operations.get('race-clean');
    expect(stored?.syncPending).toBe(false);
  });
});

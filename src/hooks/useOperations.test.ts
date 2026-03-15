import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { db } from "../db/dexie";
import { createOperation } from "../test/factories";

// Mock Firebase auth so useAuth returns a test user
vi.mock("../firebase/auth", () => ({
  onAuthChange: vi.fn((cb: (user: unknown) => void) => {
    cb({ uid: "test-user", email: "test@example.com" });
    return () => {};
  }),
}));

vi.mock("../firebase/config", () => ({
  isConfigured: false,
  app: null,
  auth: null,
  firestore: null,
}));

// Need to import after mocks are set up
const { useOperations } = await import("./useOperations");

describe("useOperations", () => {
  beforeEach(async () => {
    // Ensure clean DB — setup.ts deletes it, but we re-open it here
    if (!db.isOpen()) {
      await db.open();
    }
  });

  it("returns empty operations list initially", async () => {
    const { result } = renderHook(() => useOperations());
    await waitFor(() => {
      expect(result.current.operations).toEqual([]);
    });
  });

  it("addOperation creates an entry in IndexedDB", async () => {
    const { result } = renderHook(() => useOperations());

    await act(async () => {
      await result.current.addOperation({
        date: "2025-03-15",
        patientId: "PT001",
        chemotherapy: "",
        diagnosis: "Test diagnosis",
        procedures: ["gs_lap_chole"],
        involvement: "independent",
        otherDetails: "",
        intraOpComplications: "",
        postOpComplications: "",
        histology: "",
        followUp: "",
        complexityScore: null,
        pci: null,
        discussedMDT: false,
        notes: "",
      });
    });

    // Verify it's in IndexedDB
    const all = await db.operations.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].diagnosis).toBe("Test diagnosis");
    expect(all[0].deleted).toBe(false);
    expect(all[0].userId).toBe("test-user");
    expect(all[0].id).toBeTruthy();
    expect(all[0].createdAt).toBeTruthy();
    expect(all[0].updatedAt).toBeTruthy();
  });

  it("updateOperation modifies the entry and bumps updatedAt", async () => {
    // Seed an operation directly
    const op = createOperation({ userId: "test-user" });
    await db.operations.add(op);
    const originalUpdatedAt = op.updatedAt;

    const { result } = renderHook(() => useOperations());

    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 10));

    await act(async () => {
      await result.current.updateOperation(op.id, {
        diagnosis: "Updated diagnosis",
      });
    });

    const updated = await db.operations.get(op.id);
    expect(updated?.diagnosis).toBe("Updated diagnosis");
    expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
  });

  it("deleteOperation performs soft delete", async () => {
    const op = createOperation({ userId: "test-user" });
    await db.operations.add(op);

    const { result } = renderHook(() => useOperations());

    await act(async () => {
      await result.current.deleteOperation(op.id);
    });

    const deleted = await db.operations.get(op.id);
    expect(deleted?.deleted).toBe(true);

    // The operations list should exclude soft-deleted entries
    await waitFor(() => {
      expect(
        result.current.operations.find((o) => o.id === op.id),
      ).toBeUndefined();
    });
  });

  it("operations list excludes soft-deleted entries", async () => {
    await db.operations.bulkAdd([
      createOperation({
        userId: "test-user",
        deleted: false,
        diagnosis: "Visible",
      }),
      createOperation({
        userId: "test-user",
        deleted: true,
        diagnosis: "Deleted",
      }),
    ]);

    const { result } = renderHook(() => useOperations());

    await waitFor(() => {
      expect(result.current.operations).toHaveLength(1);
      expect(result.current.operations[0].diagnosis).toBe("Visible");
    });
  });

  it("operations are sorted by date descending", async () => {
    await db.operations.bulkAdd([
      createOperation({
        userId: "test-user",
        date: "2025-01-01",
        diagnosis: "Old",
      }),
      createOperation({
        userId: "test-user",
        date: "2025-06-01",
        diagnosis: "New",
      }),
      createOperation({
        userId: "test-user",
        date: "2025-03-15",
        diagnosis: "Mid",
      }),
    ]);

    const { result } = renderHook(() => useOperations());

    await waitFor(() => {
      expect(result.current.operations).toHaveLength(3);
      expect(result.current.operations[0].diagnosis).toBe("New");
      expect(result.current.operations[1].diagnosis).toBe("Mid");
      expect(result.current.operations[2].diagnosis).toBe("Old");
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SyncProvider } from "../../context/SyncContext";

// We need to mock navigator.onLine
const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine");

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    writable: true,
    configurable: true,
  });
}

// Import the component
const { OfflineIndicator } = await import("./OfflineIndicator");

describe("OfflineIndicator", () => {
  beforeEach(() => {
    setOnLine(true);
  });

  afterEach(() => {
    if (originalOnLine) {
      Object.defineProperty(navigator, "onLine", originalOnLine);
    }
  });

  it('shows no "Offline" text when online', () => {
    setOnLine(true);
    render(
      <SyncProvider syncing={false}>
        <OfflineIndicator />
      </SyncProvider>,
    );
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  });

  it('shows "Offline" text when offline', () => {
    setOnLine(false);
    render(
      <SyncProvider syncing={false}>
        <OfflineIndicator />
      </SyncProvider>,
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("responds to online/offline events", async () => {
    setOnLine(true);
    render(
      <SyncProvider syncing={false}>
        <OfflineIndicator />
      </SyncProvider>,
    );

    expect(screen.queryByText("Offline")).not.toBeInTheDocument();

    // Go offline
    await act(async () => {
      setOnLine(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByText("Offline")).toBeInTheDocument();

    // Go back online
    await act(async () => {
      setOnLine(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  });
});

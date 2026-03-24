import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import Dexie from 'dexie';

// Clean up rendered components after each test
afterEach(() => {
  cleanup();
});

// Reset all IndexedDB databases between tests
afterEach(async () => {
  // Delete and recreate the local IndexedDB database
  await Dexie.delete('BritOpsDB');
});

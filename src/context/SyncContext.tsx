import { createContext, useContext } from 'react';

interface SyncContextValue {
  syncing: boolean;
}

const SyncContext = createContext<SyncContextValue>({ syncing: false });

export function SyncProvider({
  children,
  syncing,
}: {
  children: React.ReactNode;
  syncing: boolean;
}) {
  return (
    <SyncContext.Provider value={{ syncing }}>
      {children}
    </SyncContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSyncContext() {
  return useContext(SyncContext);
}

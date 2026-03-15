import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SyncProvider } from '../context/SyncContext';

interface ProviderOptions {
  route?: string;
  syncing?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', syncing = false, ...renderOptions }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <SyncProvider syncing={syncing}>
          {children}
        </SyncProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

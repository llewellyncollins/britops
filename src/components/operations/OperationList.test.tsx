import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { createOperation } from '../../test/factories';
import type { OperationEntry } from '../../types';

// Mock Firebase dependencies
vi.mock('../../firebase/auth', () => ({
  onAuthChange: vi.fn((cb: (user: unknown) => void) => {
    cb(null);
    return () => {};
  }),
}));

vi.mock('../../firebase/config', () => ({
  isConfigured: false,
  app: null,
  auth: null,
  firestore: null,
}));

const { OperationList } = await import('./OperationList');

function renderList(operations: OperationEntry[]) {
  return render(
    <MemoryRouter>
      <OperationList operations={operations} />
    </MemoryRouter>,
  );
}

describe('OperationList', () => {
  it('shows empty state when no operations', () => {
    renderList([]);
    expect(screen.getByText('No operations found')).toBeInTheDocument();
  });

  it('renders operations', () => {
    const ops = [
      createOperation({ diagnosis: 'Appendicitis' }),
      createOperation({ diagnosis: 'Gallstones' }),
    ];
    renderList(ops);

    expect(screen.getByText('Appendicitis')).toBeInTheDocument();
    expect(screen.getByText('Gallstones')).toBeInTheDocument();
  });

  it('filters by diagnosis', async () => {
    const user = userEvent.setup();
    const ops = [
      createOperation({ diagnosis: 'Appendicitis' }),
      createOperation({ diagnosis: 'Gallstones' }),
    ];
    renderList(ops);

    const searchInput = screen.getByPlaceholderText('Search operations...');
    await user.type(searchInput, 'Appendicitis');

    expect(screen.getByText('Appendicitis')).toBeInTheDocument();
    expect(screen.queryByText('Gallstones')).not.toBeInTheDocument();
  });

  it('filters by patient ID', async () => {
    const user = userEvent.setup();
    const ops = [
      createOperation({ patientId: 'PT001', diagnosis: 'Case 1' }),
      createOperation({ patientId: 'PT002', diagnosis: 'Case 2' }),
    ];
    renderList(ops);

    const searchInput = screen.getByPlaceholderText('Search operations...');
    await user.type(searchInput, 'PT001');

    expect(screen.getByText('Case 1')).toBeInTheDocument();
    expect(screen.queryByText('Case 2')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', async () => {
    const user = userEvent.setup();
    const ops = [createOperation({ diagnosis: 'Appendicitis' })];
    renderList(ops);

    const searchInput = screen.getByPlaceholderText('Search operations...');
    await user.type(searchInput, 'appendicitis');

    expect(screen.getByText('Appendicitis')).toBeInTheDocument();
  });

  it('shows empty state when search matches nothing', async () => {
    const user = userEvent.setup();
    const ops = [createOperation({ diagnosis: 'Appendicitis' })];
    renderList(ops);

    const searchInput = screen.getByPlaceholderText('Search operations...');
    await user.type(searchInput, 'xyz no match');

    expect(screen.getByText('No operations found')).toBeInTheDocument();
  });
});

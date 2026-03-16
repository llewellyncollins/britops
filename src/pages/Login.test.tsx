import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  mockSignUpEmail,
  mockSignInGoogle,
  setupAuthMock,
} from '../test/mocks/firebase-auth';
import {
  mockSaveConsentRecord,
  setupFirestoreMock,
} from '../test/mocks/firebase-firestore';

vi.mock('../firebase/auth', () => setupAuthMock());
vi.mock('../firebase/firestore', () => setupFirestoreMock());
vi.mock('../firebase/config', () => ({
  isConfigured: true,
  app: null,
  auth: null,
  firestore: null,
}));

const { Login } = await import('./Login');

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login — consent capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUpEmail.mockResolvedValue({ user: { uid: 'new-user-123' } });
    mockSignInGoogle.mockResolvedValue({ user: { uid: 'google-user-456' } });
  });

  it('shows consent checkbox only in sign-up mode', () => {
    renderLogin();

    // Initially in sign-in mode — no checkbox
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    // Switch to sign-up mode
    fireEvent.click(screen.getByText('Create one'));

    // Now checkbox should appear
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getAllByText(/Privacy Policy/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Terms of Service/).length).toBeGreaterThanOrEqual(1);
  });

  it('disables Create Account button when consent is not checked', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Create one'));

    const button = screen.getByRole('button', { name: /Create Account/ });
    expect(button).toBeDisabled();
  });

  it('enables Create Account button when consent is checked', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Create one'));

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const button = screen.getByRole('button', { name: /Create Account/ });
    expect(button).not.toBeDisabled();
  });

  it('saves consent record on email sign-up', async () => {
    renderLogin();
    fireEvent.click(screen.getByText('Create one'));

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/ }));

    // Wait for async operations
    await vi.waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(mockSaveConsentRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new-user-123',
          consentGiven: true,
          privacyPolicyVersion: '1.0',
        }),
      );
    });
  });

  it('saves consent record on Google sign-in', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/ }));

    await vi.waitFor(() => {
      expect(mockSignInGoogle).toHaveBeenCalled();
      expect(mockSaveConsentRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'google-user-456',
          consentGiven: true,
          privacyPolicyVersion: '1.0',
        }),
      );
    });
  });

  it('shows privacy policy and terms links in footer', () => {
    renderLogin();

    const links = screen.getAllByText(/Privacy Policy/);
    expect(links.length).toBeGreaterThanOrEqual(1);

    const termsLinks = screen.getAllByText(/Terms of Service/);
    expect(termsLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('resets consent checkbox when toggling between sign-in and sign-up', () => {
    renderLogin();

    // Switch to sign-up
    fireEvent.click(screen.getByText('Create one'));
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Switch back to sign-in
    fireEvent.click(screen.getByText('Sign in'));

    // Switch back to sign-up — checkbox should be unchecked
    fireEvent.click(screen.getByText('Create one'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});

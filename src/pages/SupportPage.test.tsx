import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  mockCheckSupportRateLimit,
  mockSubmitSupportRequest,
  setupFirestoreMock,
} from '../test/mocks/firebase-firestore';

vi.mock('../firebase/firestore', () => setupFirestoreMock());
vi.mock('../firebase/config', () => ({
  isConfigured: true,
  app: null,
  auth: null,
  firestore: null,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid-123', email: 'doc@nhs.net' },
    loading: false,
    isConfigured: true,
  }),
}));

const { SupportPage } = await import('./SupportPage');

function renderSupportPage() {
  return render(
    <MemoryRouter initialEntries={['/support']}>
      <SupportPage />
    </MemoryRouter>,
  );
}

// Helpers to fill the form with valid values
async function fillForm({
  subject = 'App crashes when I save an operation',
  description = 'Steps to reproduce: 1. Open log op form 2. Fill all fields 3. Tap Save 4. Blank screen',
  email = 'doc@nhs.net',
}: { subject?: string; description?: string; email?: string } = {}) {
  fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: subject } });
  fireEvent.change(screen.getByLabelText(/What happened\?/), { target: { value: description } });
  const emailInput = screen.getByLabelText(/Email for follow-up/);
  fireEvent.change(emailInput, { target: { value: email } });
}

describe('SupportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckSupportRateLimit.mockResolvedValue({ allowed: true, remaining: 3 });
    mockSubmitSupportRequest.mockResolvedValue(undefined);
  });

  describe('page title', () => {
    it('sets document title on mount and restores on unmount', () => {
      const { unmount } = renderSupportPage();
      expect(document.title).toBe('Get Help — Theatrelog');
      unmount();
      expect(document.title).toBe('Theatrelog');
    });
  });

  describe('rendering', () => {
    it('renders page heading', () => {
      renderSupportPage();
      expect(screen.getByRole('heading', { name: 'Get Help' })).toBeInTheDocument();
    });

    it('renders Bug Report and Feature Request options', () => {
      renderSupportPage();
      expect(screen.getByRole('radio', { name: /Bug Report/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Feature Request/ })).toBeInTheDocument();
    });

    it('selects Bug Report by default', () => {
      renderSupportPage();
      expect(screen.getByRole('radio', { name: /Bug Report/ })).toBeChecked();
      expect(screen.getByRole('radio', { name: /Feature Request/ })).not.toBeChecked();
    });

    it('radio group has an accessible legend', () => {
      renderSupportPage();
      expect(screen.getByRole('group', { name: /What are you reporting/i })).toBeInTheDocument();
    });

    it('renders subject, description, and email fields', () => {
      renderSupportPage();
      expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
      expect(screen.getByLabelText(/What happened\?/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email for follow-up/)).toBeInTheDocument();
    });

    it('pre-fills email from auth user', () => {
      renderSupportPage();
      expect(screen.getByLabelText(/Email for follow-up/)).toHaveValue('doc@nhs.net');
    });

    it('description label changes to "Describe the feature" for feature requests', () => {
      renderSupportPage();
      fireEvent.click(screen.getByRole('radio', { name: /Feature Request/ }));
      expect(screen.getByLabelText(/Describe the feature/)).toBeInTheDocument();
    });

    it('send button is disabled when form is invalid', () => {
      renderSupportPage();
      expect(screen.getByRole('button', { name: /Send/ })).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('required fields have aria-required="true"', () => {
      renderSupportPage();
      expect(screen.getByLabelText(/Subject/)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/What happened\?/)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/Email for follow-up/)).toHaveAttribute('aria-required', 'true');
    });

    it('shows inline validation errors with role="alert"', async () => {
      renderSupportPage();
      const subjectInput = screen.getByLabelText(/Subject/);
      fireEvent.change(subjectInput, { target: { value: 'hi' } });
      fireEvent.blur(subjectInput);
      const alerts = await screen.findAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('invalid fields gain aria-invalid="true" after error', async () => {
      renderSupportPage();
      const subjectInput = screen.getByLabelText(/Subject/);
      fireEvent.change(subjectInput, { target: { value: 'hi' } });
      fireEvent.blur(subjectInput);
      await screen.findByRole('alert');
      expect(subjectInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('form has an accessible label', () => {
      renderSupportPage();
      expect(screen.getByRole('form', { name: /Support request form/i })).toBeInTheDocument();
    });
  });

  describe('bot prevention — honeypot', () => {
    it('silently drops submission when honeypot is filled', async () => {
      vi.useFakeTimers();
      renderSupportPage();
      vi.advanceTimersByTime(5000);
      await fillForm();

      const hp = document.querySelector('input[name="_hp"]') as HTMLInputElement;
      fireEvent.change(hp, { target: { value: 'bot-value' } });

      fireEvent.submit(screen.getByRole('form', { name: /Support request form/i }));
      await vi.waitFor(() => {
        expect(mockSubmitSupportRequest).not.toHaveBeenCalled();
      });
      vi.useRealTimers();
    });
  });

  describe('bot prevention — minimum fill time', () => {
    it('shows error when submitted too quickly', async () => {
      vi.useFakeTimers();
      renderSupportPage();
      // Do NOT advance timers — elapsed will be ~0s
      await fillForm();
      fireEvent.submit(screen.getByRole('form', { name: /Support request form/i }));
      await vi.waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/take a moment/i);
      });
      expect(mockSubmitSupportRequest).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('rate limiting', () => {
    it('shows error when daily limit is reached', async () => {
      mockCheckSupportRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
      vi.useFakeTimers();
      renderSupportPage();
      vi.advanceTimersByTime(5000);
      await fillForm();
      fireEvent.submit(screen.getByRole('form', { name: /Support request form/i }));
      await vi.waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/daily limit/i);
      });
      expect(mockSubmitSupportRequest).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('successful submission', () => {
    it('calls submitSupportRequest with correct fields', async () => {
      vi.useFakeTimers();
      renderSupportPage();
      vi.advanceTimersByTime(5000);
      await fillForm();
      fireEvent.submit(screen.getByRole('form', { name: /Support request form/i }));
      await vi.waitFor(() => {
        expect(mockSubmitSupportRequest).toHaveBeenCalledWith(
          'test-uid-123',
          expect.objectContaining({
            type: 'bug',
            subject: 'App crashes when I save an operation',
            email: 'doc@nhs.net',
          }),
        );
      });
      vi.useRealTimers();
    });

    it('shows success state after submission', async () => {
      vi.useFakeTimers();
      renderSupportPage();
      vi.advanceTimersByTime(5000);
      await fillForm();
      fireEvent.submit(screen.getByRole('form', { name: /Support request form/i }));
      await vi.waitFor(() => {
        expect(screen.getByRole('heading', { name: /Request sent/i })).toBeInTheDocument();
      });
      vi.useRealTimers();
    });

    it('success state includes a Back to Settings button', async () => {
      vi.useFakeTimers();
      renderSupportPage();
      vi.advanceTimersByTime(5000);
      await fillForm();
      fireEvent.submit(screen.getByRole('form', { name: /Support request form/i }));
      await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Settings/i })).toBeInTheDocument();
      });
      vi.useRealTimers();
    });

    it('submits feature request with correct type', async () => {
      vi.useFakeTimers();
      renderSupportPage();
      vi.advanceTimersByTime(5000);
      fireEvent.click(screen.getByRole('radio', { name: /Feature Request/ }));
      // Label changes to "Describe the feature" when Feature Request is selected
      fireEvent.change(screen.getByLabelText(/Subject/), {
        target: { value: 'Add PDF export to the portfolio page' },
      });
      fireEvent.change(screen.getByLabelText(/Describe the feature/), {
        target: { value: 'It would be great to export the portfolio summary as a PDF for ARCP submissions' },
      });
      fireEvent.change(screen.getByLabelText(/Email for follow-up/), {
        target: { value: 'doc@nhs.net' },
      });
      fireEvent.submit(screen.getByRole('form', { name: /Support request form/i }));
      await vi.waitFor(() => {
        expect(mockSubmitSupportRequest).toHaveBeenCalledWith(
          'test-uid-123',
          expect.objectContaining({ type: 'feature' }),
        );
      });
      vi.useRealTimers();
    });
  });

  describe('submission error', () => {
    it('shows error message when submitSupportRequest throws', async () => {
      mockSubmitSupportRequest.mockRejectedValue(new Error('Network error'));
      vi.useFakeTimers();
      renderSupportPage();
      vi.advanceTimersByTime(5000);
      await fillForm();
      fireEvent.submit(screen.getByRole('form', { name: /Support request form/i }));
      await vi.waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Failed to send/i);
      });
      vi.useRealTimers();
    });
  });
});

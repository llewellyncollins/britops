import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bug, Lightbulb, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { checkSupportRateLimit, submitSupportRequest } from '../firebase/firestore';

const MIN_FILL_SECONDS = 4;

const schema = z.object({
  type: z.enum(['bug', 'feature']),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(120, 'Subject too long'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description too long'),
  email: z.string().email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export function SupportPage() {
  const navigate = useNavigate();
  const { user, isConfigured } = useAuth();
  const mountTime = useRef(Date.now());
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      type: 'bug',
      subject: '',
      description: '',
      email: user?.email ?? '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    document.title = 'Get Help — Theatrelog';
    return () => { document.title = 'Theatrelog'; };
  }, []);

  // Redirect if Firebase not configured — form requires Firestore
  useEffect(() => {
    if (!isConfigured) navigate('/settings');
  }, [isConfigured, navigate]);

  // Move focus to success heading so screen readers announce the outcome
  useEffect(() => {
    if (submitted) successHeadingRef.current?.focus();
  }, [submitted]);

  async function onSubmit(values: FormValues) {
    setSubmitError('');

    // Honeypot check
    if (honeypot) return;

    // Minimum fill-time check
    const elapsed = (Date.now() - mountTime.current) / 1000;
    if (elapsed < MIN_FILL_SECONDS) {
      setSubmitError('Please take a moment to review your submission before sending.');
      return;
    }

    // Rate-limit check
    if (user) {
      const { allowed } = await checkSupportRateLimit(user.uid);
      if (!allowed) {
        setSubmitError('You have reached the daily limit of 3 submissions. Please try again tomorrow.');
        return;
      }
    }

    try {
      await submitSupportRequest(user!.uid, {
        type: values.type,
        subject: values.subject,
        description: values.description,
        email: values.email,
        appVersion: import.meta.env.VITE_APP_VERSION ?? '0.2.0',
        userAgent: navigator.userAgent,
      });
      setSubmitted(true);
    } catch {
      setSubmitError('Failed to send your request. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div className="p-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <CheckCircle size={56} className="text-success" aria-hidden="true" />
        <h1
          ref={successHeadingRef}
          tabIndex={-1}
          className="text-xl font-bold outline-none"
        >
          Request sent
        </h1>
        <p className="text-text-muted text-sm">
          Thanks for getting in touch. We'll review your{' '}
          {selectedType === 'bug' ? 'bug report' : 'feature request'} and follow up by email if
          needed.
        </p>
        <button
          onClick={() => navigate('/settings')}
          className="bg-surface-raised border border-border text-text px-4 py-2 rounded-lg text-sm font-medium hover:border-accent transition-colors mt-2"
        >
          Back to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-1 -ml-1 text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-xl font-bold">Get Help</h1>
      </div>

      <p className="text-sm text-text-muted">
        Report a bug or suggest a feature. We read every submission.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Support request form"
        className="space-y-5"
      >
        {/* Type toggle — fieldset/legend for correct radio group semantics */}
        <fieldset>
          <legend className="text-sm font-medium text-text mb-2">What are you reporting?</legend>
          <div className="flex gap-3">
            <label
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                selectedType === 'bug'
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface-raised border-border text-text-muted hover:border-accent'
              }`}
            >
              <input {...register('type')} type="radio" value="bug" className="sr-only" />
              <Bug size={16} aria-hidden="true" />
              Bug Report
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                selectedType === 'feature'
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface-raised border-border text-text-muted hover:border-accent'
              }`}
            >
              <input {...register('type')} type="radio" value="feature" className="sr-only" />
              <Lightbulb size={16} aria-hidden="true" />
              Feature Request
            </label>
          </div>
        </fieldset>

        {/* Subject */}
        <div>
          <label htmlFor="support-subject" className="block text-sm font-medium text-text mb-1">
            Subject <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id="support-subject"
            type="text"
            placeholder={selectedType === 'bug' ? 'e.g. Operation form crashes on submit' : 'e.g. Export to PDF'}
            maxLength={120}
            aria-required="true"
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            className="input"
            {...register('subject')}
          />
          {errors.subject && (
            <p id="subject-error" role="alert" className="text-xs text-danger mt-1">
              {errors.subject.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="support-description" className="block text-sm font-medium text-text mb-1">
            {selectedType === 'bug' ? 'What happened?' : 'Describe the feature'}{' '}
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <textarea
            id="support-description"
            rows={5}
            maxLength={1000}
            placeholder={
              selectedType === 'bug'
                ? 'Steps to reproduce: 1. Go to… 2. Tap… 3. See error…'
                : 'How would this feature work? What problem does it solve?'
            }
            aria-required="true"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-error' : undefined}
            className="input resize-none"
            {...register('description')}
          />
          {errors.description && (
            <p id="description-error" role="alert" className="text-xs text-danger mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="support-email" className="block text-sm font-medium text-text mb-1">
            Email for follow-up <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id="support-email"
            type="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="input"
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-danger mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Honeypot — hidden from real users, visible to bots */}
        <div aria-hidden="true" className="hidden" tabIndex={-1}>
          <input
            type="text"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
          />
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="w-full bg-accent text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent-dark disabled:opacity-50 transition-colors"
        >
          <Send size={16} aria-hidden="true" />
          {isSubmitting ? 'Sending…' : 'Send'}
        </button>

        <p className="text-xs text-text-muted text-center">
          Up to 3 submissions per day. Include as much detail as possible.
        </p>
      </form>
    </div>
  );
}

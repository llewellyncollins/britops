import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInEmail, signUpEmail, signInGoogle } from '../firebase/auth';
import { saveConsentRecord } from '../firebase/firestore';
import { LogIn } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await signUpEmail(email, password);
        await saveConsentRecord({
          userId: cred.user.uid,
          consentGiven: true,
          consentTimestamp: new Date().toISOString(),
          privacyPolicyVersion: '1.0',
        });
      } else {
        await signInEmail(email, password);
      }
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      const cred = await signInGoogle();
      await saveConsentRecord({
        userId: cred.user.uid,
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        privacyPolicyVersion: '1.0',
      });
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Google sign-in failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="sr-only">Sign in to Theatrelog</h1>
          <picture>
            <source srcSet="/theatrelog-primary-dark.svg" media="(prefers-color-scheme: dark)" />
            <img src="/theatrelog-primary-light.svg" alt="Theatrelog" className="h-10 mx-auto" />
          </picture>
          <p className="text-text-muted text-sm mt-2">Your logbook, sorted.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="sr-only">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="sr-only">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="input"
            />
          </div>

          {isSignUp && (
            <label className="flex items-start gap-2 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I have read and agree to the{' '}
                <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
                {' '}and{' '}
                <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link>
              </span>
            </label>
          )}

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading || (isSignUp && !consentChecked)}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-50"
          >
            <LogIn aria-hidden="true" size={18} />
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={handleGoogle}
          className="w-full border border-border py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-text-muted">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignUp(!isSignUp); setConsentChecked(false); }} className="text-accent hover:underline">
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>

        <button
          onClick={() => navigate('/')}
          className="w-full text-sm text-text-muted hover:text-text"
        >
          Continue without account (offline only)
        </button>

        <p className="text-center text-xs text-text-muted">
          By using Theatrelog you agree to our{' '}
          <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
          {' '}and{' '}
          <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}

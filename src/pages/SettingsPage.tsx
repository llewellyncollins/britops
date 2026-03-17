import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db/dexie';
import { useOperations } from '../hooks/useOperations';
import { usePortfolio } from '../hooks/usePortfolio';
import { useProcedureTypes } from '../hooks/useProcedureTypes';
import { useAuth } from '../hooks/useAuth';
import { useSettingsStore } from '../stores/useSettingsStore';
import { exportPortfolioXlsx, importFromXlsx } from '../utils/excel';
import { exportAllDataJson } from '../utils/export';
import { signOut, signInEmail, signUpEmail, signInGoogle, deleteAccount } from '../firebase/auth';
import { saveConsentRecord } from '../firebase/firestore';
import { ProcedureTypeManager } from '../components/settings/ProcedureTypeManager';
import {
  Download, Upload, Trash2, FileSpreadsheet, FileJson, Shield, ExternalLink,
  LogOut, LogIn, User, Stethoscope, ChevronDown, ChevronRight, GraduationCap, AlertTriangle,
} from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { operations, addOperation } = useOperations();
  const { allProcedures, specialties } = useProcedureTypes();
  const { specialty, setSpecialty } = useSettingsStore();
  const portfolioRows = usePortfolio(operations, allProcedures);
  const { user, isConfigured } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [showProcedures, setShowProcedures] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      if (isSignUp) {
        const cred = await signUpEmail(loginEmail, loginPassword);
        await saveConsentRecord({
          userId: cred.user.uid,
          consentGiven: true,
          consentTimestamp: new Date().toISOString(),
          privacyPolicyVersion: '1.0',
        });
      } else {
        await signInEmail(loginEmail, loginPassword);
      }
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      setConsentChecked(false);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoginError('');
    try {
      const cred = await signInGoogle();
      // Store consent for new Google sign-ups too
      await saveConsentRecord({
        userId: cred.user.uid,
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        privacyPolicyVersion: '1.0',
      });
      setShowLogin(false);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Google sign-in failed');
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1);
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      navigate('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed';
      if (msg.includes('requires-recent-login')) {
        setDeleteError('Please sign out and sign back in, then try again. Firebase requires recent authentication for account deletion.');
      } else {
        setDeleteError(msg);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function exportXlsx() {
    exportPortfolioXlsx(operations, portfolioRows, allProcedures);
  }

  async function exportCSV() {
    const ops = operations.filter(op => !op.deleted);
    const headers = [
      'Date', 'Patient ID', 'Diagnosis', 'Procedures', 'Involvement',
      'Other Details', 'Intra-op Complications', 'Post-op Complications',
      'Histology', 'Follow Up', 'Complexity Score', 'PCI', 'Discussed MDT', 'Notes',
    ];
    const rows = ops.map(op => {
      const procNames = op.procedures
        .map(id => allProcedures.find(p => p.id === id))
        .filter(Boolean)
        .map(p => p!.subcategory ? `${p!.name} (${p!.subcategory})` : p!.name)
        .join('; ');
      return [
        op.date, op.patientId, op.diagnosis, procNames, op.involvement,
        op.otherDetails, op.intraOpComplications, op.postOpComplications,
        op.histology, op.followUp ? 'Yes' : 'No', op.complexityScore ?? '', op.pci ?? '',
        op.discussedMDT ? 'Yes' : 'No', op.notes,
      ];
    });
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `britops-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult('');
    try {
      const entries = await importFromXlsx(file, allProcedures);
      let count = 0;
      for (const entry of entries) {
        await addOperation(entry);
        count++;
      }
      setImportResult(`Imported ${count} operations successfully`);
    } catch (err: unknown) {
      setImportResult(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function clearData() {
    if (confirm('Are you sure? This will delete all local operations.')) {
      await db.operations.clear();
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      {/* Specialty */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">Your Specialty</h3>
        <div className="flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg">
          <GraduationCap aria-hidden="true" size={20} className="text-primary" />
          <div className="flex-1">
            <select
              value={specialty ?? ''}
              onChange={e => setSpecialty(e.target.value || null)}
              className="input"
            >
              <option value="">Not set (show all fields)</option>
              {specialties.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              Tailors the operation form to show fields relevant to your specialty
            </p>
          </div>
        </div>
      </section>

      {/* Account */}
      {isConfigured && (
        <section className="space-y-3">
          <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">Account</h3>
          {user ? (
            <div className="flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg">
              <User aria-hidden="true" size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">{user.email ?? 'Signed in'}</p>
                <p className="text-xs text-text-muted">Syncing enabled</p>
              </div>
              <button onClick={() => signOut()} aria-label="Sign out" className="text-sm text-danger hover:underline">
                <LogOut aria-hidden="true" size={16} />
              </button>
            </div>
          ) : (
            <div className="bg-surface-raised border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowLogin(!showLogin)}
                aria-expanded={showLogin}
                aria-controls="settings-login-panel"
                className="w-full flex items-center gap-3 p-3 hover:border-primary-light text-sm font-medium text-primary"
              >
                <LogIn aria-hidden="true" size={20} />
                <span>Sign in to enable sync</span>
              </button>
              {showLogin && (
                <div id="settings-login-panel" className="border-t border-border p-3 space-y-3">
                  <form onSubmit={handleLogin} className="space-y-3">
                    <label htmlFor="settings-login-email" className="sr-only">Email address</label>
                    <input
                      id="settings-login-email"
                      type="email"
                      placeholder="Email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      className="input"
                    />
                    <label htmlFor="settings-login-password" className="sr-only">Password</label>
                    <input
                      id="settings-login-password"
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      minLength={6}
                      className="input"
                    />
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
                          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                          {' '}and{' '}
                          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                        </span>
                      </label>
                    )}
                    {loginError && <p role="alert" className="text-sm text-danger">{loginError}</p>}
                    <button
                      type="submit"
                      disabled={loginLoading || (isSignUp && !consentChecked)}
                      className="w-full bg-primary text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-50"
                    >
                      <LogIn aria-hidden="true" size={16} />
                      {loginLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                  </form>
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full border border-border py-2 rounded-lg font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>
                  <p className="text-center text-xs text-text-muted">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <button onClick={() => { setIsSignUp(!isSignUp); setLoginError(''); setConsentChecked(false); }} className="text-primary hover:underline">
                      {isSignUp ? 'Sign in' : 'Create one'}
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Procedure Types */}
      <section className="space-y-3">
        <button
          onClick={() => setShowProcedures(!showProcedures)}
          aria-expanded={showProcedures}
          aria-controls="settings-procedures-panel"
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Stethoscope aria-hidden="true" size={20} className="text-primary" />
          <div className="text-left flex-1">
            <p className="font-medium text-sm">Procedure Types</p>
            <p className="text-xs text-text-muted">
              Add custom procedures or browse {allProcedures.length} built-in entries
            </p>
          </div>
          {showProcedures ? <ChevronDown aria-hidden="true" size={16} className="text-text-muted" /> : <ChevronRight aria-hidden="true" size={16} className="text-text-muted" />}
        </button>
        {showProcedures && (
          <div id="settings-procedures-panel" className="border border-border rounded-lg p-4">
            <ProcedureTypeManager />
          </div>
        )}
      </section>

      {/* Export */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">Export</h3>

        <button
          onClick={exportXlsx}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <FileSpreadsheet aria-hidden="true" size={20} className="text-primary" />
          <div className="text-left">
            <p className="font-medium text-sm">Export Portfolio (Excel)</p>
            <p className="text-xs text-text-muted">Download as .xlsx with summary + log</p>
          </div>
        </button>

        <button
          onClick={exportCSV}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Download aria-hidden="true" size={20} className="text-primary" />
          <div className="text-left">
            <p className="font-medium text-sm">Export to CSV</p>
            <p className="text-xs text-text-muted">Download all operations as CSV</p>
          </div>
        </button>

        {user && (
          <button
            onClick={() => exportAllDataJson(user.uid)}
            className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
          >
            <FileJson aria-hidden="true" size={20} className="text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">Export All My Data (JSON)</p>
              <p className="text-xs text-text-muted">Complete data export for GDPR portability</p>
            </div>
          </button>
        )}
      </section>

      {/* Import */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">Import</h3>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Upload aria-hidden="true" size={20} className="text-primary" />
          <div className="text-left">
            <p className="font-medium text-sm">{importing ? 'Importing...' : 'Import from Excel'}</p>
            <p className="text-xs text-text-muted">Import operations from .xlsx logbook</p>
          </div>
        </button>
        {importResult && (
          <p className={`text-sm ${importResult.includes('failed') ? 'text-danger' : 'text-success'}`}>
            {importResult}
          </p>
        )}
      </section>

      {/* Privacy & Data */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">Privacy &amp; Data</h3>

        <Link
          to="/privacy"
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Shield aria-hidden="true" size={20} className="text-primary" />
          <div className="text-left flex-1">
            <p className="font-medium text-sm">Privacy Policy</p>
            <p className="text-xs text-text-muted">How your data is collected, stored, and protected</p>
          </div>
          <ExternalLink aria-hidden="true" size={16} className="text-text-muted" />
        </Link>

        <Link
          to="/terms"
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <FileSpreadsheet aria-hidden="true" size={20} className="text-primary" />
          <div className="text-left flex-1">
            <p className="font-medium text-sm">Terms of Service</p>
            <p className="text-xs text-text-muted">Usage terms and clinical disclaimer</p>
          </div>
          <ExternalLink aria-hidden="true" size={16} className="text-text-muted" />
        </Link>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">Danger Zone</h3>
        <button
          onClick={clearData}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-red-200 rounded-lg hover:border-danger transition-colors"
        >
          <Trash2 aria-hidden="true" size={20} className="text-danger" />
          <div className="text-left">
            <p className="font-medium text-sm text-danger">Clear all operations</p>
            <p className="text-xs text-text-muted">Permanently delete all local operation data</p>
          </div>
        </button>

        {user && (
          <div className="space-y-2">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-red-200 rounded-lg hover:border-danger transition-colors"
            >
              <AlertTriangle aria-hidden="true" size={20} className="text-danger" />
              <div className="text-left">
                <p className="font-medium text-sm text-danger">
                  {deleting ? 'Deleting...' : deleteConfirmStep === 0 ? 'Delete Account & All Data' : 'Confirm: Delete Everything'}
                </p>
                <p className="text-xs text-text-muted">
                  {deleteConfirmStep === 0
                    ? 'Permanently remove your account and all cloud data'
                    : 'This cannot be undone. All operations, settings, and your account will be permanently deleted.'}
                </p>
              </div>
            </button>
            {deleteConfirmStep === 1 && !deleting && (
              <button
                onClick={() => setDeleteConfirmStep(0)}
                className="w-full text-sm text-text-muted hover:text-text"
              >
                Cancel
              </button>
            )}
            {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          </div>
        )}
      </section>

      {/* About */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">About</h3>
        <p className="text-sm text-text-muted">BritOps v0.2.0 — Surgical operation logbook</p>
        <p className="text-xs text-text-muted">
          Data stored locally on device.{' '}
          {isConfigured ? 'Firebase sync available.' : 'Configure Firebase for cloud sync.'}
        </p>
        <p className="text-xs text-text-muted">
          Deleted operations are permanently purged after 30 days.
        </p>
      </section>
    </div>
  );
}

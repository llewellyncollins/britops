import { useRef, useState } from 'react';
import { db } from '../db/dexie';
import { useOperations } from '../hooks/useOperations';
import { usePortfolio } from '../hooks/usePortfolio';
import { useProcedureTypes } from '../hooks/useProcedureTypes';
import { useAuth } from '../hooks/useAuth';
import { exportPortfolioXlsx, importFromXlsx } from '../utils/excel';
import { signOut, signInEmail, signUpEmail, signInGoogle } from '../firebase/auth';
import { ProcedureTypeManager } from '../components/settings/ProcedureTypeManager';
import {
  Download, Upload, Trash2, FileSpreadsheet,
  LogOut, LogIn, User, Stethoscope, ChevronDown, ChevronRight,
} from 'lucide-react';

export function SettingsPage() {
  const { operations, addOperation } = useOperations();
  const { allProcedures } = useProcedureTypes();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      if (isSignUp) {
        await signUpEmail(loginEmail, loginPassword);
      } else {
        await signInEmail(loginEmail, loginPassword);
      }
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message?.replace('Firebase: ', '') ?? 'Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoginError('');
    try {
      await signInGoogle();
      setShowLogin(false);
    } catch (err: any) {
      setLoginError(err.message?.replace('Firebase: ', '') ?? 'Google sign-in failed');
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
        op.histology, op.followUp, op.complexityScore ?? '', op.pci ?? '',
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
    } catch (err: any) {
      setImportResult(`Import failed: ${err.message}`);
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

      {/* Account */}
      {isConfigured && (
        <section className="space-y-3">
          <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">Account</h3>
          {user ? (
            <div className="flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg">
              <User size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">{user.email ?? 'Signed in'}</p>
                <p className="text-xs text-text-muted">Syncing enabled</p>
              </div>
              <button onClick={() => signOut()} className="text-sm text-danger hover:underline">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="bg-surface-raised border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="w-full flex items-center gap-3 p-3 hover:border-primary-light text-sm font-medium text-primary"
              >
                <LogIn size={20} />
                <span>Sign in to enable sync</span>
              </button>
              {showLogin && (
                <div className="border-t border-border p-3 space-y-3">
                  <form onSubmit={handleLogin} className="space-y-3">
                    <input
                      type="email"
                      placeholder="Email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      className="input"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      minLength={6}
                      className="input"
                    />
                    {loginError && <p className="text-sm text-danger">{loginError}</p>}
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-primary text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-50"
                    >
                      <LogIn size={16} />
                      {loginLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                  </form>
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full border border-border py-2 rounded-lg font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>
                  <p className="text-center text-xs text-text-muted">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <button onClick={() => { setIsSignUp(!isSignUp); setLoginError(''); }} className="text-primary hover:underline">
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
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Stethoscope size={20} className="text-primary" />
          <div className="text-left flex-1">
            <p className="font-medium text-sm">Procedure Types</p>
            <p className="text-xs text-text-muted">
              Add custom procedures or browse {allProcedures.length} built-in entries
            </p>
          </div>
          {showProcedures ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
        </button>
        {showProcedures && (
          <div className="border border-border rounded-lg p-4">
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
          <FileSpreadsheet size={20} className="text-primary" />
          <div className="text-left">
            <p className="font-medium text-sm">Export Portfolio (Excel)</p>
            <p className="text-xs text-text-muted">Download as .xlsx with summary + log</p>
          </div>
        </button>

        <button
          onClick={exportCSV}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Download size={20} className="text-primary" />
          <div className="text-left">
            <p className="font-medium text-sm">Export to CSV</p>
            <p className="text-xs text-text-muted">Download all operations as CSV</p>
          </div>
        </button>
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
          <Upload size={20} className="text-primary" />
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

      {/* Danger Zone */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">Danger Zone</h3>
        <button
          onClick={clearData}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-red-200 rounded-lg hover:border-danger transition-colors"
        >
          <Trash2 size={20} className="text-danger" />
          <div className="text-left">
            <p className="font-medium text-sm text-danger">Clear all operations</p>
            <p className="text-xs text-text-muted">Permanently delete all local operation data</p>
          </div>
        </button>
      </section>

      {/* About */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide">About</h3>
        <p className="text-sm text-text-muted">BritOps v0.2.0 — Surgical operation logbook</p>
        <p className="text-xs text-text-muted">
          Data stored locally on device.{' '}
          {isConfigured ? 'Firebase sync available.' : 'Configure Firebase for cloud sync.'}
        </p>
      </section>
    </div>
  );
}

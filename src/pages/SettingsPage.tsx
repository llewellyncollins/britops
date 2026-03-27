import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db/dexie';
import { useOperations } from '../hooks/useOperations';
import { usePortfolio } from '../hooks/usePortfolio';
import { useProcedureTypes } from '../hooks/useProcedureTypes';
import { useAuth } from '../hooks/useAuth';
import { useSettingsStore } from '../stores/useSettingsStore';
import { TRAINEE_GRADES } from '../data/grades';
import { exportPortfolioXlsx, importFromXlsx } from '../utils/excel';
import { exportAllDataJson } from '../utils/export';
import { signOut, deleteAccount } from '../firebase/auth';
import { ProcedureTypeManager } from '../components/settings/ProcedureTypeManager';
import {
  Download, Upload, Trash2, FileSpreadsheet, FileJson, Shield, ExternalLink,
  LogOut, LogIn, User, Stethoscope, ChevronDown, ChevronRight, GraduationCap, AlertTriangle,
  Monitor, Sun, Moon, MessageCircle,
} from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { operations, addOperation } = useOperations();
  const { allProcedures, specialties } = useProcedureTypes();
  const { specialty, setSpecialty, grade, setGrade, theme, setTheme } = useSettingsStore();
  const portfolioRows = usePortfolio(operations, allProcedures);
  const { user, isConfigured } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [showProcedures, setShowProcedures] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!user) { navigate('/login?returnTo=/settings'); return; }
    exportPortfolioXlsx(operations, portfolioRows, allProcedures);
  }

  async function exportCSV() {
    if (!user) { navigate('/login?returnTo=/settings'); return; }
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
    a.download = `theatrelog-export-${new Date().toISOString().split('T')[0]}.csv`;
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
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="font-semibold text-text text-sm uppercase tracking-wide">Appearance</h2>
        <div className="p-3 bg-surface-raised border border-border rounded-lg space-y-2">
          <p className="text-sm font-medium text-text">Theme</p>
          <div className="flex gap-2">
            {([
              { value: 'system', label: 'System', Icon: Monitor },
              { value: 'light',  label: 'Light',  Icon: Sun },
              { value: 'dark',   label: 'Dark',   Icon: Moon },
            ] as const).map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-pressed={theme === value}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  theme === value
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-text-muted hover:border-primary-light'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Profile */}
      <section className="space-y-3">
        <h2 className="font-semibold text-text text-sm uppercase tracking-wide">Clinical Profile</h2>
        <div className="space-y-3 p-3 bg-surface-raised border border-border rounded-lg">
          <div className="flex items-start gap-3">
            <Stethoscope aria-hidden="true" size={20} className="text-accent mt-2 shrink-0" />
            <div className="flex-1 space-y-3">
              <div>
                <label htmlFor="settings-grade" className="block text-sm font-medium text-text mb-1">Trainee grade</label>
                <select
                  id="settings-grade"
                  value={grade ?? ''}
                  onChange={e => setGrade(e.target.value || null)}
                  className="input"
                >
                  <option value="">Not set</option>
                  {TRAINEE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <p className="text-xs text-text-muted">Pre-fills grade on each new operation you log</p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty */}
      <section className="space-y-3">
        <h2 id="settings-specialty-label" className="font-semibold text-text text-sm uppercase tracking-wide">Your Specialty</h2>
        <div className="flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg">
          <GraduationCap aria-hidden="true" size={20} className="text-accent shrink-0" />
          <div className="flex-1">
            <select
              id="settings-specialty"
              aria-labelledby="settings-specialty-label"
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
          <h2 className="font-semibold text-text text-sm uppercase tracking-wide">Account</h2>
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg">
                <User aria-hidden="true" size={20} className="text-accent shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{user.email ?? 'Signed in'}</p>
                  <p className="text-xs text-text-muted">Syncing enabled</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-2 p-2.5 border border-border rounded-lg text-sm font-medium text-text-muted hover:text-danger hover:border-danger transition-colors"
              >
                <LogOut aria-hidden="true" size={16} />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login?returnTo=/settings')}
              className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
            >
              <LogIn aria-hidden="true" size={20} className="text-accent shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">Sign in to enable sync</p>
                <p className="text-xs text-text-muted">Back up and sync your logbook across devices</p>
              </div>
            </button>
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
          <Stethoscope aria-hidden="true" size={20} className="text-accent shrink-0" />
          <div className="text-left flex-1">
            <p className="font-medium text-sm text-text">Procedure Types</p>
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
        <h2 className="font-semibold text-text text-sm uppercase tracking-wide">Export</h2>

        <button
          onClick={exportXlsx}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <FileSpreadsheet aria-hidden="true" size={20} className="text-accent shrink-0" />
          <div className="text-left">
            <p className="font-medium text-sm">Export Portfolio (Excel)</p>
            <p className="text-xs text-text-muted">Download as .xlsx with summary + log</p>
          </div>
        </button>

        <button
          onClick={exportCSV}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Download aria-hidden="true" size={20} className="text-accent shrink-0" />
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
            <FileJson aria-hidden="true" size={20} className="text-accent shrink-0" />
            <div className="text-left">
              <p className="font-medium text-sm">Export All My Data (JSON)</p>
              <p className="text-xs text-text-muted">Complete data export for GDPR portability</p>
            </div>
          </button>
        )}
      </section>

      {/* Import */}
      <section className="space-y-3">
        <h2 className="font-semibold text-text text-sm uppercase tracking-wide">Import</h2>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => { if (!user) { navigate('/login?returnTo=/settings'); return; } fileInputRef.current?.click(); }}
          disabled={importing}
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Upload aria-hidden="true" size={20} className="text-accent shrink-0" />
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
        <h2 className="font-semibold text-text text-sm uppercase tracking-wide">Privacy &amp; Data</h2>

        <Link
          to="/privacy"
          className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
        >
          <Shield aria-hidden="true" size={20} className="text-accent shrink-0" />
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
          <FileSpreadsheet aria-hidden="true" size={20} className="text-accent shrink-0" />
          <div className="text-left flex-1">
            <p className="font-medium text-sm">Terms of Service</p>
            <p className="text-xs text-text-muted">Usage terms and clinical disclaimer</p>
          </div>
          <ExternalLink aria-hidden="true" size={16} className="text-text-muted" />
        </Link>
      </section>

      {/* Support */}
      {isConfigured && (
        <section className="space-y-3">
          <h2 className="font-semibold text-text text-sm uppercase tracking-wide">Support</h2>
          <button
            onClick={() => user ? navigate('/support') : navigate('/login?returnTo=/support')}
            className="w-full flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-lg hover:border-primary-light transition-colors"
          >
            <MessageCircle aria-hidden="true" size={20} className="text-accent shrink-0" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Get help or report an issue</p>
              <p className="text-xs text-text-muted">Report a bug or suggest a new feature</p>
            </div>
            <ChevronRight aria-hidden="true" size={16} className="text-text-muted" />
          </button>
        </section>
      )}

      {/* Danger Zone */}
      <section className="space-y-3 border border-danger/30 bg-danger/5 rounded-xl p-4">
        <h2 className="font-semibold text-danger text-sm uppercase tracking-wide flex items-center gap-1.5">
          <AlertTriangle aria-hidden="true" size={15} />
          Danger Zone
        </h2>
        <button
          onClick={clearData}
          className="w-full flex items-center gap-3 p-3 bg-danger text-white rounded-lg hover:bg-warning transition-colors"
        >
          <Trash2 aria-hidden="true" size={20} />
          <div className="text-left">
            <p className="font-semibold text-sm">Clear all operations</p>
            <p className="text-xs opacity-80">Permanently delete all local operation data</p>
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
        <h2 className="font-semibold text-text text-sm uppercase tracking-wide">About</h2>
        <p className="text-sm text-text-muted">Theatrelog v0.2.0 — Surgical operation logbook</p>
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

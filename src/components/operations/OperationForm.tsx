import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcedurePicker } from './ProcedurePicker';
import { useOperations } from '../../hooks/useOperations';
import { useProcedureTypes } from '../../hooks/useProcedureTypes';
import type { InvolvementLevel, OperationEntry } from '../../types';
import { Save } from 'lucide-react';

interface Props {
  existing?: OperationEntry;
}

const INVOLVEMENT_OPTIONS: { value: InvolvementLevel; label: string }[] = [
  { value: 'assistant', label: 'Assistant' },
  { value: 'supervised', label: 'Surgeon supervised' },
  { value: 'independent', label: 'Surgeon independent' },
];

export function OperationForm({ existing }: Props) {
  const navigate = useNavigate();
  const { addOperation, updateOperation } = useOperations();
  const { allProcedures } = useProcedureTypes();

  const [form, setForm] = useState({
    date: existing?.date ?? new Date().toISOString().split('T')[0],
    patientId: existing?.patientId ?? '',
    chemotherapy: existing?.chemotherapy ?? '',
    diagnosis: existing?.diagnosis ?? '',
    procedures: existing?.procedures ?? [] as string[],
    involvement: existing?.involvement ?? 'assistant' as InvolvementLevel,
    otherDetails: existing?.otherDetails ?? '',
    intraOpComplications: existing?.intraOpComplications ?? '',
    postOpComplications: existing?.postOpComplications ?? '',
    histology: existing?.histology ?? '',
    followUp: existing?.followUp ?? '',
    complexityScore: existing?.complexityScore ?? null as number | null,
    pci: existing?.pci ?? null as number | null,
    discussedMDT: existing?.discussedMDT ?? false,
    notes: existing?.notes ?? '',
  });

  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (existing) {
        await updateOperation(existing.id, form);
      } else {
        await addOperation(form);
      }
      navigate('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold">{existing ? 'Edit Operation' : 'Log Operation'}</h2>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required className="input" />
        </Field>
        <Field label="Patient ID">
          <input type="text" value={form.patientId} onChange={e => set('patientId', e.target.value)} className="input" placeholder="Hospital number" />
        </Field>
      </div>

      <Field label="Diagnosis">
        <input type="text" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} className="input" placeholder="e.g., Gr 2 EEC" />
      </Field>

      <ProcedurePicker
        selected={form.procedures}
        onChange={v => set('procedures', v)}
        procedures={allProcedures}
      />

      <Field label="Involvement level" required>
        <div className="flex gap-2">
          {INVOLVEMENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('involvement', opt.value)}
              className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                form.involvement === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text border-border hover:border-primary-light'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Chemotherapy / Pre-op notes">
        <input type="text" value={form.chemotherapy} onChange={e => set('chemotherapy', e.target.value)} className="input" placeholder="nil, NACT, etc." />
      </Field>

      <Field label="Other procedure details">
        <input type="text" value={form.otherDetails} onChange={e => set('otherDetails', e.target.value)} className="input" placeholder="Additional details" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Intra-op complications">
          <input type="text" value={form.intraOpComplications} onChange={e => set('intraOpComplications', e.target.value)} className="input" placeholder="nil" />
        </Field>
        <Field label="Post-op complications">
          <input type="text" value={form.postOpComplications} onChange={e => set('postOpComplications', e.target.value)} className="input" placeholder="nil" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Histology">
          <input type="text" value={form.histology} onChange={e => set('histology', e.target.value)} className="input" />
        </Field>
        <Field label="Follow up">
          <input type="text" value={form.followUp} onChange={e => set('followUp', e.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Complexity score">
          <input
            type="number"
            min={0}
            max={10}
            value={form.complexityScore ?? ''}
            onChange={e => set('complexityScore', e.target.value ? Number(e.target.value) : null)}
            className="input"
          />
        </Field>
        <Field label="PCI">
          <input
            type="number"
            min={0}
            max={39}
            value={form.pci ?? ''}
            onChange={e => set('pci', e.target.value ? Number(e.target.value) : null)}
            className="input"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.discussedMDT}
          onChange={e => set('discussedMDT', e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-sm">Discussed at MDT</span>
      </label>

      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="input min-h-[60px]"
          placeholder="e.g., send OSAT, R0 no concerns"
        />
      </Field>

      <button
        type="submit"
        disabled={saving || form.procedures.length === 0}
        className="w-full bg-primary text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        <Save size={18} />
        {saving ? 'Saving...' : existing ? 'Update Operation' : 'Save Operation'}
      </button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-muted mb-1">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

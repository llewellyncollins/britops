import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useOperations } from '../../hooks/useOperations';
import { useProcedureTypes } from '../../hooks/useProcedureTypes';
import { useSettingsStore } from '../../stores/useSettingsStore';
import {
  getSchemaForSpecialty,
  getFieldsForSpecialty,
  getDefaultValues,
  ALL_OPTIONAL_KEYS,
  OPTIONAL_FIELD_MAP,
  type OptionalFieldKey,
} from '../../data/formSchemas';
import { FormBuilder } from './FormBuilder';
import type { OperationEntry } from '../../types';
import { Save, GraduationCap } from 'lucide-react';

interface Props {
  existing?: OperationEntry;
}

export function OperationForm({ existing }: Props) {
  const specialty = useSettingsStore(s => s.specialty);
  const setSpecialty = useSettingsStore(s => s.setSpecialty);

  // Remount inner form when specialty changes so schema/fields/defaults reset
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold">{existing ? 'Edit Operation' : 'Log Operation'}</h2>

      <SpecialtySelector specialty={specialty} onChange={setSpecialty} />

      <OperationFormInner key={specialty ?? '__none__'} specialty={specialty} existing={existing} />
    </div>
  );
}

function SpecialtySelector({ specialty, onChange }: { specialty: string | null; onChange: (s: string | null) => void }) {
  const { specialties } = useProcedureTypes();

  return (
    <div className="flex items-center gap-2 p-2 bg-surface-raised border border-border rounded-lg">
      <GraduationCap aria-hidden="true" size={16} className="text-primary shrink-0" />
      <label htmlFor="specialty-select" className="sr-only">Specialty</label>
      <select
        id="specialty-select"
        value={specialty ?? ''}
        onChange={e => onChange(e.target.value || null)}
        className="flex-1 text-sm bg-transparent border-none focus:ring-0 cursor-pointer"
      >
        <option value="">All specialties (show all fields)</option>
        {specialties.map(sp => (
          <option key={sp} value={sp}>{sp}</option>
        ))}
      </select>
    </div>
  );
}

function OperationFormInner({ specialty, existing }: { specialty: string | null; existing?: OperationEntry }) {
  const navigate = useNavigate();
  const { addOperation, updateOperation } = useOperations();
  const grade = useSettingsStore(s => s.grade);

  // Get base fields for this specialty
  let fields = getFieldsForSpecialty(specialty);
  const schema = getSchemaForSpecialty(specialty);

  // Backward compat: when editing, show fields that have data even if
  // the current specialty wouldn't normally include them
  if (existing) {
    const currentKeys = new Set(fields.map(f => f.key));
    for (const key of ALL_OPTIONAL_KEYS) {
      if (currentKeys.has(key)) continue;
      const val = existing[key as keyof OperationEntry];
      if (val !== null && val !== '' && val !== false && val !== undefined) {
        const followUpIdx = fields.findIndex(f => f.key === 'followUp');
        const insertIdx = followUpIdx >= 0 ? followUpIdx : fields.length;
        fields = [...fields.slice(0, insertIdx), OPTIONAL_FIELD_MAP[key as OptionalFieldKey], ...fields.slice(insertIdx)];
      }
    }
  }

  // Pre-fill grade from settings for new operations
  const settingsDefaults = existing ? {} : { grade: grade ?? '' };
  const defaultValues = getDefaultValues(specialty, {
    ...settingsDefaults,
    ...(existing as unknown as Record<string, unknown>),
  });

  const { control, handleSubmit, formState: { isSubmitting, isValid } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  async function onSubmit(data: Record<string, unknown>) {
    if (existing) {
      await updateOperation(existing.id, data as Partial<OperationEntry>);
    } else {
      await addOperation(data as Omit<OperationEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deleted'>);
    }
    navigate('/');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormBuilder fields={fields} control={control} />

      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="w-full bg-primary text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        <Save aria-hidden="true" size={18} />
        {isSubmitting ? 'Saving...' : existing ? 'Update Operation' : 'Save Operation'}
      </button>
    </form>
  );
}

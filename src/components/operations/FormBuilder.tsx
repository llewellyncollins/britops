import { Controller, type Control, type FieldValues } from 'react-hook-form';
import { ProcedurePicker } from './ProcedurePicker';
import { useProcedureTypes } from '../../hooks/useProcedureTypes';
import type { FieldMeta } from '../../data/formSchemas';

interface FormBuilderProps {
  fields: FieldMeta[];
  control: Control<FieldValues>;
}

export function FormBuilder({ fields, control }: FormBuilderProps) {
  const { allProcedures } = useProcedureTypes();

  // Group fields into rows based on colSpan
  const rows: FieldMeta[][] = [];
  let currentRow: FieldMeta[] = [];
  let currentSpan = 0;

  for (const field of fields) {
    const span = field.colSpan ?? 2;
    if (span === 2 || currentSpan + span > 2) {
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [field];
      currentSpan = span;
    } else {
      currentRow.push(field);
      currentSpan += span;
    }
    if (currentSpan >= 2) {
      rows.push(currentRow);
      currentRow = [];
      currentSpan = 0;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return (
    <div className="space-y-4">
      {rows.map((row, i) => {
        const isGrid = row.length > 1 || (row.length === 1 && (row[0].colSpan ?? 2) === 1);
        if (isGrid && row.length > 1) {
          return (
            <div key={i} className="grid grid-cols-2 gap-3">
              {row.map(field => (
                <FieldRenderer key={field.key} field={field} control={control} procedures={allProcedures} />
              ))}
            </div>
          );
        }
        return (
          <FieldRenderer key={row[0].key} field={row[0]} control={control} procedures={allProcedures} />
        );
      })}
    </div>
  );
}

function FieldRenderer({
  field,
  control,
  procedures,
}: {
  field: FieldMeta;
  control: Control<FieldValues>;
  procedures: ReturnType<typeof useProcedureTypes>['allProcedures'];
}) {
  if (field.type === 'procedures') {
    return (
      <Controller
        name={field.key}
        control={control}
        render={({ field: f }) => (
          <ProcedurePicker
            selected={f.value ?? []}
            onChange={f.onChange}
            procedures={procedures}
          />
        )}
      />
    );
  }

  if (field.type === 'select' && field.key === 'involvement') {
    return (
      <Controller
        name={field.key}
        control={control}
        render={({ field: f }) => (
          <FieldWrapper label={field.label} required={field.required}>
            <div className="flex gap-2">
              {field.options?.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => f.onChange(opt.value)}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                    f.value === opt.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-text border-border hover:border-primary-light'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FieldWrapper>
        )}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <Controller
        name={field.key}
        control={control}
        render={({ field: f }) => (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={f.value ?? false}
              onChange={e => f.onChange(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm">{field.label}</span>
          </label>
        )}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <Controller
        name={field.key}
        control={control}
        render={({ field: f }) => (
          <FieldWrapper label={field.label} required={field.required}>
            <textarea
              value={f.value ?? ''}
              onChange={f.onChange}
              className="input min-h-[60px]"
              placeholder={field.placeholder}
            />
          </FieldWrapper>
        )}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <Controller
        name={field.key}
        control={control}
        render={({ field: f }) => (
          <FieldWrapper label={field.label} required={field.required}>
            <input
              type="number"
              min={field.min}
              max={field.max}
              value={f.value ?? ''}
              onChange={e => f.onChange(e.target.value ? Number(e.target.value) : null)}
              className="input"
            />
          </FieldWrapper>
        )}
      />
    );
  }

  // text and date inputs
  return (
    <Controller
      name={field.key}
      control={control}
      render={({ field: f }) => (
        <FieldWrapper label={field.label} required={field.required}>
          <input
            type={field.type === 'date' ? 'date' : 'text'}
            value={f.value ?? ''}
            onChange={f.onChange}
            required={field.required}
            className="input"
            placeholder={field.placeholder}
          />
        </FieldWrapper>
      )}
    />
  );
}

function FieldWrapper({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-muted mb-1">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

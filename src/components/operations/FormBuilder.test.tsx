import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { FormBuilder } from './FormBuilder';
import type { FieldMeta } from '../../data/formSchemas';

vi.mock('../../hooks/useProcedureTypes', () => ({
  useProcedureTypes: vi.fn(() => ({
    allProcedures: [
      { id: 'gs_lap_chole', name: 'Laparoscopic cholecystectomy', category: 'Hepatobiliary', specialty: 'General Surgery', isCustom: false },
    ],
    customTypes: [],
    specialties: ['General Surgery'],
    addProcedureType: vi.fn(),
    removeProcedureType: vi.fn(),
  })),
}));

vi.mock('../../hooks/useTier', () => ({
  useTier: vi.fn(() => ({
    tier: 'paid',
    can: () => true,
    requiredTier: () => 'free',
    loading: false,
    refreshClaims: vi.fn(),
  })),
}));

vi.mock('../../firebase/analytics', () => ({
  trackUpgradePrompted: vi.fn(),
}));

function TestWrapper({ fields }: { fields: FieldMeta[] }) {
  const { control } = useForm({
    defaultValues: fields.reduce((acc, f) => {
      if (f.type === 'boolean') acc[f.key] = false;
      else if (f.type === 'number') acc[f.key] = null;
      else if (f.type === 'procedures') acc[f.key] = [];
      else acc[f.key] = '';
      return acc;
    }, {} as Record<string, unknown>),
  });
  return <FormBuilder fields={fields} control={control} />;
}

describe('FormBuilder', () => {
  it('renders text input fields', () => {
    const fields: FieldMeta[] = [
      { key: 'patientId', label: 'Patient ID', type: 'text' },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByLabelText('Patient ID')).toBeInTheDocument();
  });

  it('renders date input fields', () => {
    const fields: FieldMeta[] = [
      { key: 'date', label: 'Date', type: 'date', required: true },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByLabelText(/Date/)).toBeInTheDocument();
  });

  it('renders textarea fields', () => {
    const fields: FieldMeta[] = [
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Add notes...' },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add notes...')).toBeInTheDocument();
  });

  it('renders boolean checkbox fields', () => {
    const fields: FieldMeta[] = [
      { key: 'followUp', label: 'Follow-up required', type: 'boolean' },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByText('Follow-up required')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders number input fields', () => {
    const fields: FieldMeta[] = [
      { key: 'complexityScore', label: 'Complexity Score', type: 'number', min: 0, max: 10 },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByLabelText('Complexity Score')).toBeInTheDocument();
  });

  it('renders select fields with options', () => {
    const fields: FieldMeta[] = [
      {
        key: 'hospital',
        label: 'Hospital',
        type: 'select',
        options: [
          { value: 'hospital_a', label: 'Hospital A' },
          { value: 'hospital_b', label: 'Hospital B' },
        ],
      },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByLabelText('Hospital')).toBeInTheDocument();
    expect(screen.getByText('Hospital A')).toBeInTheDocument();
    expect(screen.getByText('Hospital B')).toBeInTheDocument();
  });

  it('renders involvement as radio button group', () => {
    const fields: FieldMeta[] = [
      {
        key: 'involvement',
        label: 'Involvement',
        type: 'select',
        options: [
          { value: 'assistant', label: 'Assistant' },
          { value: 'supervised', label: 'Supervised' },
          { value: 'independent', label: 'Independent' },
        ],
      },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(screen.getByText('Supervised')).toBeInTheDocument();
    expect(screen.getByText('Independent')).toBeInTheDocument();
  });

  it('renders combobox fields with datalist', () => {
    const fields: FieldMeta[] = [
      {
        key: 'hospital',
        label: 'Hospital',
        type: 'combobox',
        suggestions: ['Hospital A', 'Hospital B'],
        placeholder: 'Start typing...',
      },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByLabelText('Hospital')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Start typing...')).toBeInTheDocument();
  });

  it('renders required indicator', () => {
    const fields: FieldMeta[] = [
      { key: 'date', label: 'Date', type: 'date', required: true },
    ];
    render(<TestWrapper fields={fields} />);
    const label = screen.getByText('Date');
    expect(label.parentElement?.textContent).toContain('*');
  });

  it('renders multiple fields', () => {
    const fields: FieldMeta[] = [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'patientId', label: 'Patient ID', type: 'text' },
      { key: 'followUp', label: 'Follow-up', type: 'boolean' },
    ];
    render(<TestWrapper fields={fields} />);
    expect(screen.getByLabelText(/Date/)).toBeInTheDocument();
    expect(screen.getByLabelText('Patient ID')).toBeInTheDocument();
    expect(screen.getByText('Follow-up')).toBeInTheDocument();
  });
});

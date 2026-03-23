import { z } from 'zod';
import { TRAINEE_GRADES } from './grades';

// ─── Field metadata for form rendering ───────────────────────────────────────

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea' | 'procedures' | 'combobox';

export interface FieldMeta {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  suggestions?: string[];
  colSpan?: 1 | 2;
}

// ─── Base fields (universal, all specialties) ────────────────────────────────

const BASE_FIELDS: FieldMeta[] = [
  { key: 'date', label: 'Date', type: 'date', required: true, colSpan: 1 },
  { key: 'patientId', label: 'Patient ID', type: 'text', placeholder: 'Hospital number', colSpan: 1 },
  { key: 'grade', label: 'Grade', type: 'select', colSpan: 2, options: TRAINEE_GRADES.map(g => ({ value: g, label: g })) },
  { key: 'diagnosis', label: 'Diagnosis', type: 'text', placeholder: 'e.g., Gr 2 EEC', colSpan: 2 },
  { key: 'procedures', label: 'Procedures', type: 'procedures', required: true, colSpan: 2 },
  {
    key: 'involvement', label: 'Involvement level', type: 'select', required: true, colSpan: 2,
    options: [
      { value: 'assistant', label: 'Assistant' },
      { value: 'supervised', label: 'Surgeon supervised' },
      { value: 'independent', label: 'Surgeon independent' },
    ],
  },
  { key: 'otherDetails', label: 'Other procedure details', type: 'text', placeholder: 'Additional details', colSpan: 2 },
  { key: 'intraOpComplications', label: 'Intra-op complications', type: 'text', placeholder: 'nil', colSpan: 1 },
  { key: 'postOpComplications', label: 'Post-op complications', type: 'text', placeholder: 'nil', colSpan: 1 },
  { key: 'followUp', label: 'Requires follow-up', type: 'boolean', required: true, colSpan: 2 },
  { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'e.g., send OSAT, R0 no concerns', colSpan: 2 },
];

// ─── Optional specialty-specific fields ──────────────────────────────────────

const CHEMOTHERAPY_FIELD: FieldMeta = {
  key: 'chemotherapy', label: 'Chemotherapy / Pre-op notes', type: 'text', placeholder: 'nil, NACT, etc.', colSpan: 2,
};

const HISTOLOGY_FIELD: FieldMeta = {
  key: 'histology', label: 'Histology', type: 'text', colSpan: 1,
};

const COMPLEXITY_SCORE_FIELD: FieldMeta = {
  key: 'complexityScore', label: 'Complexity score', type: 'number', min: 0, max: 10, colSpan: 1,
};

const PCI_FIELD: FieldMeta = {
  key: 'pci', label: 'PCI', type: 'number', min: 0, max: 39, colSpan: 1,
};

// ─── Specialty → extra fields mapping ────────────────────────────────────────

type OptionalFieldKey = 'chemotherapy' | 'histology' | 'complexityScore' | 'pci';

const OPTIONAL_FIELD_MAP: Record<OptionalFieldKey, FieldMeta> = {
  chemotherapy: CHEMOTHERAPY_FIELD,
  histology: HISTOLOGY_FIELD,
  complexityScore: COMPLEXITY_SCORE_FIELD,
  pci: PCI_FIELD,
};

const SPECIALTY_EXTRA_FIELDS: Record<string, OptionalFieldKey[]> = {
  'General Surgery': ['chemotherapy', 'histology', 'complexityScore', 'pci'],
  'Obstetrics & Gynaecology': ['chemotherapy', 'histology', 'complexityScore', 'pci'],
  'Urology': ['chemotherapy', 'histology', 'complexityScore'],
  'Cardiothoracic': ['chemotherapy', 'histology', 'complexityScore'],
  'ENT': ['chemotherapy', 'histology'],
  'Maxillofacial': ['chemotherapy', 'histology'],
  'Neurosurgery': ['chemotherapy', 'histology', 'complexityScore'],
  'Vascular Surgery': ['complexityScore'],
  'Orthopaedics': ['complexityScore'],
  'Plastic Surgery': ['histology'],
  'Ophthalmology': [],
  'Paediatric Surgery': ['histology'],
  'Transplant Surgery': ['histology', 'complexityScore'],
  'Other': ['chemotherapy', 'histology', 'complexityScore', 'pci'],
};

const ALL_OPTIONAL_KEYS: OptionalFieldKey[] = ['chemotherapy', 'histology', 'complexityScore', 'pci'];

// ─── Public API ──────────────────────────────────────────────────────────────

export function getExtraFieldKeys(specialty: string | null): OptionalFieldKey[] {
  if (!specialty) return ALL_OPTIONAL_KEYS;
  return SPECIALTY_EXTRA_FIELDS[specialty] ?? ALL_OPTIONAL_KEYS;
}

export function getFieldsForSpecialty(specialty: string | null): FieldMeta[] {
  const extraKeys = getExtraFieldKeys(specialty);
  const extraFields = extraKeys.map(k => OPTIONAL_FIELD_MAP[k]);

  // Insert extra fields before followUp (index of followUp in base)
  const followUpIndex = BASE_FIELDS.findIndex(f => f.key === 'followUp');
  const fields = [...BASE_FIELDS];
  fields.splice(followUpIndex, 0, ...extraFields);
  return fields;
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const baseOperationSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  patientId: z.string(),
  grade: z.string(),
  diagnosis: z.string(),
  procedures: z.array(z.string()).min(1, 'At least one procedure is required'),
  involvement: z.enum(['assistant', 'supervised', 'independent']),
  otherDetails: z.string(),
  intraOpComplications: z.string(),
  postOpComplications: z.string(),
  followUp: z.boolean(),
  notes: z.string(),
});

const chemotherapyField = z.object({ chemotherapy: z.string() });
const histologyField = z.object({ histology: z.string() });
const complexityScoreField = z.object({ complexityScore: z.number().min(0).max(10).nullable() });
const pciField = z.object({ pci: z.number().min(0).max(39).nullable() });

const OPTIONAL_SCHEMA_MAP: Record<OptionalFieldKey, z.ZodObject<z.ZodRawShape>> = {
  chemotherapy: chemotherapyField,
  histology: histologyField,
  complexityScore: complexityScoreField,
  pci: pciField,
};

export function getSchemaForSpecialty(specialty: string | null) {
  const extraKeys = getExtraFieldKeys(specialty);
  let schema: z.ZodObject<z.ZodRawShape> = baseOperationSchema;
  for (const key of extraKeys) {
    schema = schema.merge(OPTIONAL_SCHEMA_MAP[key]);
  }
  return schema;
}

export function getDefaultValues(specialty: string | null, existing?: Record<string, unknown>) {
  const extraKeys = getExtraFieldKeys(specialty);
  const defaults: Record<string, unknown> = {
    date: new Date().toISOString().split('T')[0],
    patientId: '',
    grade: '',
    diagnosis: '',
    procedures: [],
    involvement: 'assistant',
    otherDetails: '',
    intraOpComplications: '',
    postOpComplications: '',
    followUp: false,
    notes: '',
  };

  // Add defaults for optional fields
  for (const key of extraKeys) {
    if (key === 'chemotherapy' || key === 'histology') defaults[key] = '';
    if (key === 'complexityScore' || key === 'pci') defaults[key] = null;
  }

  // Overlay existing values if editing
  if (existing) {
    for (const [k, v] of Object.entries(existing)) {
      if (k in defaults) defaults[k] = v;
    }
  }

  return defaults;
}

export { ALL_OPTIONAL_KEYS, OPTIONAL_FIELD_MAP };
export type { OptionalFieldKey };

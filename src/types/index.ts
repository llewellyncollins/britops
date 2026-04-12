export type InvolvementLevel = 'assistant' | 'supervised' | 'independent';

export type UserTier = 'free' | 'signed-in' | 'paid';

export type GatedFeature =
  | 'sync'
  | 'import'
  | 'exportCsv'
  | 'exportXlsx'
  | 'exportJson'
  | 'portfolio'
  | 'gradeSetting'
  | 'specialtySetting'
  | 'support'
  | 'customProcedures';

export interface ProcedureType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  specialty: string;
  isCustom: boolean;
}

export interface OperationEntry {
  id: string;
  userId: string;
  date: string;
  hospital: string;
  grade: string;
  patientId: string;
  chemotherapy: string;
  diagnosis: string;
  procedures: string[];
  involvement: InvolvementLevel;
  otherDetails: string;
  intraOpComplications: string;
  postOpComplications: string;
  histology: string;
  followUp: boolean;
  complexityScore: number | null;
  pci: number | null;
  discussedMDT: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  /** ISO timestamp set when soft-deleted. Firestore TTL policy auto-purges 30 days after this. */
  deletedAt: string | null;
  /** True when the operation has not yet been confirmed written to Firestore. */
  syncPending: boolean;
}

export interface ConsentRecord {
  userId: string;
  consentGiven: boolean;
  consentTimestamp: string;
  privacyPolicyVersion: string;
}

export interface PortfolioRow {
  procedureId: string;
  procedure: string;
  category: string;
  subcategory?: string;
  specialty: string;
  total: number;
  assistant: number;
  supervised: number;
  independent: number;
}

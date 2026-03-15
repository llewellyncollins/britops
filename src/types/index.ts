export type InvolvementLevel = 'assistant' | 'supervised' | 'independent';

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
  patientId: string;
  chemotherapy: string;
  diagnosis: string;
  procedures: string[];
  involvement: InvolvementLevel;
  otherDetails: string;
  intraOpComplications: string;
  postOpComplications: string;
  histology: string;
  followUp: string;
  complexityScore: number | null;
  pci: number | null;
  discussedMDT: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
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

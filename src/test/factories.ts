import { v4 as uuidv4 } from 'uuid';
import type { OperationEntry, ProcedureType, PortfolioRow } from '../types';

export function createOperation(
  overrides: Partial<OperationEntry> = {},
): OperationEntry {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    userId: 'test-user',
    date: '2025-03-15',
    patientId: 'PT001',
    chemotherapy: '',
    diagnosis: 'Gallstone disease',
    procedures: ['gs_lap_chole'],
    involvement: 'independent',
    otherDetails: '',
    intraOpComplications: '',
    postOpComplications: '',
    histology: '',
    followUp: '',
    complexityScore: null,
    pci: null,
    discussedMDT: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
    deleted: false,
    ...overrides,
  };
}

export function createProcedureType(
  overrides: Partial<ProcedureType> = {},
): ProcedureType {
  return {
    id: `custom_test_${Date.now()}`,
    name: 'Test Procedure',
    category: 'Test Category',
    specialty: 'General Surgery',
    isCustom: true,
    ...overrides,
  };
}

export function createPortfolioRow(
  overrides: Partial<PortfolioRow> = {},
): PortfolioRow {
  return {
    procedureId: 'gs_lap_chole',
    procedure: 'Laparoscopic cholecystectomy',
    category: 'Hepatobiliary',
    specialty: 'General Surgery',
    total: 5,
    assistant: 1,
    supervised: 2,
    independent: 2,
    ...overrides,
  };
}

export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    ...overrides,
  };
}

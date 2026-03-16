import { db } from '../db/dexie';
import type { OperationEntry, ProcedureType } from '../types';

interface DataExport {
  exportDate: string;
  dataVersion: '1.0';
  operations: OperationEntry[];
  customProcedureTypes: ProcedureType[];
  settings: Record<string, unknown>;
}

/**
 * Export all user data as a structured JSON file (GDPR Articles 15/20).
 */
export async function exportAllDataJson(userId: string): Promise<void> {
  const allOps = await db.operations.toArray();
  const userOps = allOps.filter(op => op.userId === userId);

  const allTypes = await db.procedureTypes.toArray();
  const customTypes = allTypes.filter(t => t.isCustom);

  const settingsRaw = localStorage.getItem('britops-settings');
  const settings = settingsRaw ? JSON.parse(settingsRaw) : {};

  const data: DataExport = {
    exportDate: new Date().toISOString(),
    dataVersion: '1.0',
    operations: userOps,
    customProcedureTypes: customTypes,
    settings,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `britops-data-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

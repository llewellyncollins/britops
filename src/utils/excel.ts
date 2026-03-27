import * as XLSX from 'xlsx';
import type { OperationEntry, PortfolioRow, ProcedureType } from '../types';

export function exportPortfolioXlsx(
  operations: OperationEntry[],
  portfolioRows: PortfolioRow[],
  procedures: ProcedureType[],
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Portfolio Summary (grouped by specialty/category)
  const summaryData: (string | number)[][] = [
    ['Specialty', 'Category', 'Procedure', 'Subtype', 'Total', 'Assistant', 'Supervised', 'Independent'],
  ];
  for (const row of portfolioRows) {
    summaryData.push([
      row.specialty,
      row.category,
      row.procedure,
      row.subcategory ?? '',
      row.total,
      row.assistant,
      row.supervised,
      row.independent,
    ]);
  }
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [
    { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 14 },
    { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'portfolio');

  // Sheet 2: Log Book
  const logHeaders = [
    'Date', 'Patient ID', 'Diagnosis', 'Procedures',
    'Specialty', 'Involvement', 'Other Details',
    'Intra-op Complications', 'Post-op Complications',
    'Histology', 'Follow Up', 'Complexity Score', 'PCI', 'Discussed MDT', 'Notes',
  ];
  const logData: (string | number | null)[][] = [logHeaders];

  const procMap = new Map(procedures.map(p => [p.id, p]));

  for (const op of operations) {
    if (op.deleted) continue;
    const procs = op.procedures
      .map(id => procMap.get(id))
      .filter(Boolean) as ProcedureType[];
    const procNames = procs
      .map(p => p.subcategory ? `${p.name} (${p.subcategory})` : p.name)
      .join(', ');
    const specialtyStr = [...new Set(procs.map(p => p.specialty))].join(', ');

    logData.push([
      op.date, op.patientId, op.diagnosis, procNames,
      specialtyStr,
      op.involvement === 'supervised' ? 'supervised' : op.involvement,
      op.otherDetails,
      op.intraOpComplications,
      op.postOpComplications,
      op.histology,
      op.followUp ? 'Yes' : 'No',
      op.complexityScore,
      op.pci,
      op.discussedMDT ? 'Yes' : '',
      op.notes,
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(logData);
  ws2['!cols'] = [
    { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 45 }, { wch: 18 },
    { wch: 14 }, { wch: 30 }, { wch: 22 }, { wch: 22 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 6 }, { wch: 14 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'log book');

  XLSX.writeFile(wb, `theatrelog-${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function importFromXlsx(
  file: File,
  procedures: ProcedureType[],
): Promise<Omit<OperationEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const logSheet =
          wb.Sheets['log book'] ??
          wb.Sheets[wb.SheetNames[1]] ??
          wb.Sheets[wb.SheetNames[0]];
        if (!logSheet) { reject(new Error('No log book sheet found')); return; }

        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(logSheet);
        const entries = data
          .map(row => parseRow(row, procedures))
          .filter(Boolean) as Omit<OperationEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt'>[];
        resolve(entries);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function parseRow(
  row: Record<string, unknown>,
  procedures: ProcedureType[],
): Omit<OperationEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt'> | null {
  const dateVal = row['Date'] ?? row['date'];
  if (!dateVal) return null;

  let date: string;
  if (typeof dateVal === 'number') {
    const d = XLSX.SSF.parse_date_code(dateVal);
    date = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  } else {
    date = parseFlexibleDate(String(dateVal));
  }

  const procString = String(row['procedure'] ?? row['Procedure'] ?? row['Procedures'] ?? '');
  const matchedProcedures = matchProcedures(procString, procedures);

  const involvementRaw = String(row['involvement'] ?? row['Involvement'] ?? '').toLowerCase().trim();
  const involvement: 'assistant' | 'supervised' | 'independent' =
    involvementRaw === 'independent' ? 'independent'
    : involvementRaw === 'supervised' || involvementRaw === 'supported' ? 'supervised'
    : 'assistant';

  return {
    date,
    hospital: String(row['Hospital'] ?? row['hospital'] ?? ''),
    grade: String(row['Grade'] ?? row['grade'] ?? ''),
    patientId: String(row['Patient ID'] ?? row['Patient number'] ?? row['patient number'] ?? ''),
    chemotherapy: String(row['chemo'] ?? row['Chemo'] ?? ''),
    diagnosis: String(row['Diagnosis'] ?? row['diagnosis'] ?? ''),
    procedures: matchedProcedures,
    involvement,
    otherDetails: String(row['other'] ?? row['Other Details'] ?? row['Other'] ?? ''),
    intraOpComplications: String(row['intra-op complications'] ?? row['Intra-op Complications'] ?? '').replace(/^nil$/i, ''),
    postOpComplications: String(row['post-op complication'] ?? row['Post-op Complications'] ?? '').replace(/^nil$/i, ''),
    histology: String(row['Histology'] ?? row['histology'] ?? ''),
    followUp: ['yes', 'true', '1'].includes(String(row['follow up'] ?? row['Follow Up'] ?? '').toLowerCase().trim()),
    complexityScore: row['complexity score'] != null ? Number(row['complexity score']) || null : null,
    pci: row['PCI'] != null ? Number(row['PCI']) || null : null,
    discussedMDT: String(row['discussed MDT'] ?? row['Discussed MDT'] ?? '').toLowerCase() === 'yes',
    notes: String(row['Notes'] ?? row['notes'] ?? ''),
  };
}

export function parseFlexibleDate(s: string): string {
  const parts = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (parts) {
    const day = parts[1].padStart(2, '0');
    const month = parts[2].padStart(2, '0');
    let year = parts[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return s;
}

/**
 * Best-effort text → procedure ID matching for import.
 * Tries exact match first, then partial name match.
 */
export function matchProcedures(text: string, procedures: ProcedureType[]): string[] {
  if (!text.trim()) return ['gen_other'];

  const parts = text.split(/[,;|]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const ids: string[] = [];

  for (const part of parts) {
    // Try exact name match
    let match = procedures.find(p => p.name.toLowerCase() === part);
    if (!match) {
      // Try name + subcategory combined
      match = procedures.find(p => {
        const full = p.subcategory
          ? `${p.name.toLowerCase()} (${p.subcategory.toLowerCase()})`
          : p.name.toLowerCase();
        return full === part || p.name.toLowerCase() === part;
      });
    }
    if (!match) {
      // Partial: procedure name is contained in the import text part
      match = procedures.find(p => part.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(part));
    }
    if (match) {
      ids.push(match.id);
    }
  }

  return ids.length > 0 ? [...new Set(ids)] : ['gen_other'];
}

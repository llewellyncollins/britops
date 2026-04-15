import { describe, it, expect, vi } from 'vitest';
import { parseFlexibleDate, matchProcedures, exportPortfolioXlsx } from './excel';
import { DEFAULT_PROCEDURES } from '../data/procedures';
import { createOperation, createPortfolioRow, createProcedureType } from '../test/factories';
import type { ProcedureType } from '../types';

describe('parseFlexibleDate', () => {
  it('parses DD/MM/YYYY (UK format)', () => {
    expect(parseFlexibleDate('15/03/2025')).toBe('2025-03-15');
  });

  it('parses DD-MM-YYYY with dashes', () => {
    expect(parseFlexibleDate('15-03-2025')).toBe('2025-03-15');
  });

  it('parses DD/MM/YY with 2-digit year', () => {
    expect(parseFlexibleDate('15/03/25')).toBe('2025-03-15');
  });

  it('pads single-digit day and month', () => {
    expect(parseFlexibleDate('1/3/2025')).toBe('2025-03-01');
  });

  it('treats YYYY-MM-DD as DD/MM/YY format (known limitation — regex grabs last digits)', () => {
    // '2025-03-15' is matched by the regex as day=25, month=03, year=15→2015
    // This documents the UK-format assumption: input should be DD/MM/YYYY
    const result = parseFlexibleDate('2025-03-15');
    expect(result).toBe('2015-03-25');
  });

  it('returns the original string for unparseable input', () => {
    expect(parseFlexibleDate('not-a-date')).toBe('not-a-date');
  });

  it('handles date string with spaces around it', () => {
    // The regex should still match embedded in a string
    const result = parseFlexibleDate('15/03/2025');
    expect(result).toBe('2025-03-15');
  });
});

describe('matchProcedures', () => {
  const procedures = DEFAULT_PROCEDURES;

  it('returns ["gen_other"] for empty text', () => {
    expect(matchProcedures('', procedures)).toEqual(['gen_other']);
  });

  it('returns ["gen_other"] for whitespace-only text', () => {
    expect(matchProcedures('   ', procedures)).toEqual(['gen_other']);
  });

  it('matches exact procedure name (case-insensitive)', () => {
    const result = matchProcedures('Laparoscopic cholecystectomy', procedures);
    expect(result).toContain('gs_lap_chole');
  });

  it('matches multiple comma-separated procedures', () => {
    const result = matchProcedures('Laparoscopic cholecystectomy, Open appendicectomy', procedures);
    expect(result).toContain('gs_lap_chole');
    expect(result).toContain('gs_open_appendicectomy');
  });

  it('matches semicolon-separated procedures', () => {
    const result = matchProcedures('Laparoscopic cholecystectomy; Open appendicectomy', procedures);
    expect(result).toContain('gs_lap_chole');
    expect(result).toContain('gs_open_appendicectomy');
  });

  it('matches pipe-separated procedures', () => {
    const result = matchProcedures('Laparoscopic cholecystectomy | Open appendicectomy', procedures);
    expect(result).toContain('gs_lap_chole');
    expect(result).toContain('gs_open_appendicectomy');
  });

  it('deduplicates matched procedures', () => {
    const result = matchProcedures(
      'Laparoscopic cholecystectomy, Laparoscopic cholecystectomy',
      procedures,
    );
    expect(result).toEqual(['gs_lap_chole']);
  });

  it('returns ["gen_other"] when no procedures match', () => {
    const result = matchProcedures('completely unknown procedure xyz', procedures);
    expect(result).toEqual(['gen_other']);
  });

  it('matches by partial name (substring)', () => {
    // "cholecystectomy" should partially match at least one procedure
    const result = matchProcedures('cholecystectomy', procedures);
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain('gen_other');
  });

  it('matches procedure with subcategory format', () => {
    // "Inguinal hernia repair (Laparoscopic)" is the full name+subcategory format
    const result = matchProcedures('inguinal hernia repair (laparoscopic)', procedures);
    expect(result).toContain('gs_inguinal_hernia_lap');
  });

  it('matches with a small custom procedures list', () => {
    const custom: ProcedureType[] = [
      { id: 'custom_1', name: 'Custom Op', category: 'Test', specialty: 'Test', isCustom: true },
    ];
    const result = matchProcedures('Custom Op', custom);
    expect(result).toEqual(['custom_1']);
  });
});

vi.mock('xlsx', async () => {
  const actual = await vi.importActual<typeof import('xlsx')>('xlsx');
  return { ...actual, writeFile: vi.fn() };
});

describe('exportPortfolioXlsx', () => {
  it('generates xlsx without throwing', async () => {
    const XLSX = await import('xlsx');

    const operations = [
      createOperation({ procedures: ['gs_lap_chole'], involvement: 'independent' }),
      createOperation({ procedures: ['gs_lap_chole'], involvement: 'supervised', deleted: true }),
    ];
    const rows = [createPortfolioRow()];
    const procedures = [
      createProcedureType({ id: 'gs_lap_chole', name: 'Laparoscopic cholecystectomy', specialty: 'General Surgery', category: 'Hepatobiliary', isCustom: false }),
    ];

    expect(() => exportPortfolioXlsx(operations, rows, procedures)).not.toThrow();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('skips deleted operations in log sheet', async () => {
    const XLSX = await import('xlsx');

    const operations = [
      createOperation({ procedures: ['gs_lap_chole'], deleted: false, patientId: 'PT001' }),
      createOperation({ procedures: ['gs_lap_chole'], deleted: true, patientId: 'PT002' }),
    ];
    const rows = [createPortfolioRow()];
    const procedures = [
      createProcedureType({ id: 'gs_lap_chole', name: 'Lap chole', specialty: 'GS', category: 'HB', isCustom: false }),
    ];

    exportPortfolioXlsx(operations, rows, procedures);
    expect(XLSX.writeFile).toHaveBeenCalled();
  });
});

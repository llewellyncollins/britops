import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePortfolio } from './usePortfolio';
import { DEFAULT_PROCEDURES } from '../data/procedures';
import { createOperation } from '../test/factories';

describe('usePortfolio', () => {
  const procedures = DEFAULT_PROCEDURES;

  it('returns empty array when no operations', () => {
    const { result } = renderHook(() => usePortfolio([], procedures));
    expect(result.current).toEqual([]);
  });

  it('aggregates a single operation correctly', () => {
    const ops = [createOperation({ procedures: ['gs_lap_chole'], involvement: 'independent' })];
    const { result } = renderHook(() => usePortfolio(ops, procedures));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].procedureId).toBe('gs_lap_chole');
    expect(result.current[0].total).toBe(1);
    expect(result.current[0].independent).toBe(1);
    expect(result.current[0].assistant).toBe(0);
    expect(result.current[0].supervised).toBe(0);
  });

  it('excludes deleted operations', () => {
    const ops = [
      createOperation({ procedures: ['gs_lap_chole'], deleted: true }),
      createOperation({ procedures: ['gs_lap_chole'], deleted: false }),
    ];
    const { result } = renderHook(() => usePortfolio(ops, procedures));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].total).toBe(1);
  });

  it('counts multiple operations for the same procedure', () => {
    const ops = [
      createOperation({ procedures: ['gs_lap_chole'], involvement: 'assistant' }),
      createOperation({ procedures: ['gs_lap_chole'], involvement: 'supervised' }),
      createOperation({ procedures: ['gs_lap_chole'], involvement: 'independent' }),
      createOperation({ procedures: ['gs_lap_chole'], involvement: 'independent' }),
    ];
    const { result } = renderHook(() => usePortfolio(ops, procedures));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].total).toBe(4);
    expect(result.current[0].assistant).toBe(1);
    expect(result.current[0].supervised).toBe(1);
    expect(result.current[0].independent).toBe(2);
  });

  it('handles multi-procedure operations (each procedure counted)', () => {
    const ops = [
      createOperation({
        procedures: ['gs_lap_chole', 'gs_open_appendicectomy'],
        involvement: 'independent',
      }),
    ];
    const { result } = renderHook(() => usePortfolio(ops, procedures));

    expect(result.current).toHaveLength(2);
    const chole = result.current.find(r => r.procedureId === 'gs_lap_chole');
    const appendix = result.current.find(r => r.procedureId === 'gs_open_appendicectomy');
    expect(chole?.total).toBe(1);
    expect(appendix?.total).toBe(1);
  });

  it('skips unknown procedure IDs', () => {
    const ops = [
      createOperation({ procedures: ['nonexistent_id'], involvement: 'independent' }),
    ];
    const { result } = renderHook(() => usePortfolio(ops, procedures));
    expect(result.current).toHaveLength(0);
  });

  it('sorts by specialty → category → procedure name', () => {
    const ops = [
      createOperation({ procedures: ['gs_lap_chole'], involvement: 'independent' }),
      createOperation({ procedures: ['gs_open_appendicectomy'], involvement: 'assistant' }),
      createOperation({ procedures: ['orth_thr'], involvement: 'supervised' }),
    ];
    const { result } = renderHook(() => usePortfolio(ops, procedures));

    expect(result.current.length).toBe(3);
    // General Surgery comes before Orthopaedics alphabetically
    expect(result.current[0].specialty).toBe('General Surgery');
    // Orthopaedics should be last
    expect(result.current[result.current.length - 1].specialty).toBe('Orthopaedics');
  });

  it('preserves subcategory in the portfolio row', () => {
    const ops = [
      createOperation({ procedures: ['gs_inguinal_hernia_lap'], involvement: 'independent' }),
    ];
    const { result } = renderHook(() => usePortfolio(ops, procedures));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].subcategory).toBe('Laparoscopic');
  });
});

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (class name merger)', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('resolves Tailwind color conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('keeps non-conflicting Tailwind classes', () => {
    const result = cn('p-4', 'mt-2', 'text-sm');
    expect(result).toContain('p-4');
    expect(result).toContain('mt-2');
    expect(result).toContain('text-sm');
  });
});

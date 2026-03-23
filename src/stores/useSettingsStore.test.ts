import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useSettingsStore.setState({ specialty: null, grade: null });
  });

  it('has null specialty initially', () => {
    expect(useSettingsStore.getState().specialty).toBeNull();
  });

  it('setSpecialty updates the value', () => {
    useSettingsStore.getState().setSpecialty('Orthopaedics');
    expect(useSettingsStore.getState().specialty).toBe('Orthopaedics');
  });

  it('setSpecialty can reset to null', () => {
    useSettingsStore.getState().setSpecialty('ENT');
    useSettingsStore.getState().setSpecialty(null);
    expect(useSettingsStore.getState().specialty).toBeNull();
  });

  it('setSettings updates all settings', () => {
    useSettingsStore.getState().setSettings({ specialty: 'Urology', grade: 'ST5' });
    expect(useSettingsStore.getState().specialty).toBe('Urology');
    expect(useSettingsStore.getState().grade).toBe('ST5');
  });
});

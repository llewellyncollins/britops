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

  it('has system theme by default', () => {
    expect(useSettingsStore.getState().theme).toBe('system');
  });

  it('setTheme updates theme preference', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('setTheme can set to light', () => {
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('setGrade updates grade', () => {
    useSettingsStore.getState().setGrade('ST3');
    expect(useSettingsStore.getState().grade).toBe('ST3');
  });

  it('setGrade can reset to null', () => {
    useSettingsStore.getState().setGrade('ST5');
    useSettingsStore.getState().setGrade(null);
    expect(useSettingsStore.getState().grade).toBeNull();
  });

  it('portfolioShowKpis defaults to true', () => {
    expect(useSettingsStore.getState().portfolioShowKpis).toBe(true);
  });

  it('setPortfolioShowKpis toggles value', () => {
    useSettingsStore.getState().setPortfolioShowKpis(false);
    expect(useSettingsStore.getState().portfolioShowKpis).toBe(false);
    useSettingsStore.getState().setPortfolioShowKpis(true);
    expect(useSettingsStore.getState().portfolioShowKpis).toBe(true);
  });

  it('portfolioShowTimeline defaults to true', () => {
    expect(useSettingsStore.getState().portfolioShowTimeline).toBe(true);
  });

  it('setPortfolioShowTimeline toggles value', () => {
    useSettingsStore.getState().setPortfolioShowTimeline(false);
    expect(useSettingsStore.getState().portfolioShowTimeline).toBe(false);
  });

  it('portfolioShowInvolvement defaults to true', () => {
    expect(useSettingsStore.getState().portfolioShowInvolvement).toBe(true);
  });

  it('setPortfolioShowInvolvement toggles value', () => {
    useSettingsStore.getState().setPortfolioShowInvolvement(false);
    expect(useSettingsStore.getState().portfolioShowInvolvement).toBe(false);
  });
});

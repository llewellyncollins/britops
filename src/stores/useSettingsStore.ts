import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSettings {
  specialty: string | null;
  grade: string | null;
}

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState extends UserSettings {
  theme: ThemePreference;
  portfolioShowKpis: boolean;
  portfolioShowTimeline: boolean;
  portfolioShowInvolvement: boolean;
  setSpecialty: (specialty: string | null) => void;
  setGrade: (grade: string | null) => void;
  setTheme: (theme: ThemePreference) => void;
  setSettings: (settings: UserSettings) => void;
  setPortfolioShowKpis: (v: boolean) => void;
  setPortfolioShowTimeline: (v: boolean) => void;
  setPortfolioShowInvolvement: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      specialty: null,
      grade: null,
      theme: 'system',
      portfolioShowKpis: true,
      portfolioShowTimeline: true,
      portfolioShowInvolvement: true,
      setSpecialty: (specialty) => set({ specialty }),
      setGrade: (grade) => set({ grade }),
      setTheme: (theme) => set({ theme }),
      setSettings: (settings) => set(settings),
      setPortfolioShowKpis: (v) => set({ portfolioShowKpis: v }),
      setPortfolioShowTimeline: (v) => set({ portfolioShowTimeline: v }),
      setPortfolioShowInvolvement: (v) => set({ portfolioShowInvolvement: v }),
    }),
    { name: 'theatrelog-settings' },
  ),
);

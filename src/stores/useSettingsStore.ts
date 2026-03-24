import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSettings {
  specialty: string | null;
  grade: string | null;
}

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState extends UserSettings {
  theme: ThemePreference;
  setSpecialty: (specialty: string | null) => void;
  setGrade: (grade: string | null) => void;
  setTheme: (theme: ThemePreference) => void;
  setSettings: (settings: UserSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      specialty: null,
      grade: null,
      theme: 'system',
      setSpecialty: (specialty) => set({ specialty }),
      setGrade: (grade) => set({ grade }),
      setTheme: (theme) => set({ theme }),
      setSettings: (settings) => set(settings),
    }),
    { name: 'theatrelog-settings' },
  ),
);

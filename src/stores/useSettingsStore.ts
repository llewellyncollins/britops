import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSettings {
  specialty: string | null;
  grade: string | null;
}

interface SettingsState extends UserSettings {
  setSpecialty: (specialty: string | null) => void;
  setGrade: (grade: string | null) => void;
  setSettings: (settings: UserSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      specialty: null,
      grade: null,
      setSpecialty: (specialty) => set({ specialty }),
      setGrade: (grade) => set({ grade }),
      setSettings: (settings) => set(settings),
    }),
    { name: 'theatrelog-settings' },
  ),
);

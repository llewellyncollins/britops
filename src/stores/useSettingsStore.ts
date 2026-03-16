import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSettings {
  specialty: string | null;
}

interface SettingsState extends UserSettings {
  setSpecialty: (specialty: string | null) => void;
  setSettings: (settings: UserSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      specialty: null,
      setSpecialty: (specialty) => set({ specialty }),
      setSettings: (settings) => set(settings),
    }),
    { name: 'britops-settings' },
  ),
);

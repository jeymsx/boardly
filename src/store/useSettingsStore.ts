import { create } from 'zustand';
import { storage } from '../utils/storage';
import { DEFAULT_SETTINGS, type AppSettings } from '../types';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: storage.get<AppSettings>('settings', DEFAULT_SETTINGS),

  updateSettings: (patch) =>
    set(state => {
      const next = { ...state.settings, ...patch };
      storage.set('settings', next);
      return { settings: next };
    }),

  resetSettings: () => {
    storage.set('settings', DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));

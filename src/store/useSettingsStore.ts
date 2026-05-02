import { create } from 'zustand';
import { storage } from '../utils/storage';
import { scheduleSettingsSync } from '../lib/sync';
import { DEFAULT_SETTINGS, type AppSettings } from '../types';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings:  () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: storage.get<AppSettings>('settings', DEFAULT_SETTINGS),

  updateSettings: (patch) => {
    set(state => {
      const next = { ...state.settings, ...patch };
      storage.set('settings', next);
      return { settings: next };
    });
    scheduleSettingsSync(get().settings);
  },

  resetSettings: () => {
    storage.set('settings', DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
    scheduleSettingsSync(DEFAULT_SETTINGS);
  },
}));

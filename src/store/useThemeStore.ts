import { create } from 'zustand';
import { storage } from '../utils/storage';

type Theme = 'dark' | 'light';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const saved = storage.get<Theme>('theme', 'light');
applyTheme(saved);

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: saved,

  toggleTheme: () =>
    set(state => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      storage.set('theme', next);
      applyTheme(next);
      return { theme: next };
    }),

  setTheme: (theme) => {
    storage.set('theme', theme);
    applyTheme(theme);
    set({ theme });
  },
}));

import { create } from 'zustand';
import type { NavPage } from '../types';

interface NavStore {
  page: NavPage;
  navigate: (page: NavPage) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  page: 'dashboard',
  navigate: (page) => set({ page }),
}));

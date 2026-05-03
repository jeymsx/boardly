import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

export type ToastType = 'success' | 'info' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, type = 'success') => {
    const id = uuid();
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3200);
  },

  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));

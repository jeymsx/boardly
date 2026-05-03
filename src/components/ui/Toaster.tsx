import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
            pointer-events-auto animate-slide-up max-w-xs lg:max-w-sm w-full
            ${toast.type === 'success'
              ? 'bg-white dark:bg-ink-800 border-emerald-200 dark:border-emerald-500/30 text-slate-800 dark:text-slate-200'
              : toast.type === 'error'
              ? 'bg-white dark:bg-ink-800 border-rose-200 dark:border-rose-500/30 text-slate-800 dark:text-slate-200'
              : 'bg-white dark:bg-ink-800 border-slate-200 dark:border-ink-700/50 text-slate-800 dark:text-slate-200'}`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            : toast.type === 'error'
            ? <AlertCircle size={16} className="text-rose-500 shrink-0" />
            : <Info size={16} className="text-sky-500 shrink-0" />}
          <p className="text-sm font-body flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300
              transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};

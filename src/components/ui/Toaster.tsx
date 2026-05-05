import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

const TOAST_STYLES = {
  success: {
    bar:    'bg-emerald-500',
    icon:   <CheckCircle2 size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0" />,
    wrap:   'border-slate-200 dark:border-ink-700/60 bg-white dark:bg-ink-850',
  },
  error: {
    bar:    'bg-rose-500',
    icon:   <AlertCircle size={15} className="text-rose-500 shrink-0" />,
    wrap:   'border-slate-200 dark:border-ink-700/60 bg-white dark:bg-ink-850',
  },
  info: {
    bar:    'bg-sky-500',
    icon:   <Info size={15} className="text-sky-500 shrink-0" />,
    wrap:   'border-slate-200 dark:border-ink-700/60 bg-white dark:bg-ink-850',
  },
};

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none items-center
      lg:top-auto lg:bottom-6 lg:left-auto lg:right-5 lg:translate-x-0 lg:items-end">
      {toasts.map(toast => {
        const s = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 pl-0 pr-4 py-0 rounded-xl shadow-lg border
              pointer-events-auto animate-slide-up overflow-hidden
              max-w-[320px] w-full ${s.wrap}`}
          >
            <span className={`w-1 self-stretch shrink-0 ${s.bar}`} />
            <div className="flex items-center gap-2.5 py-3 flex-1 min-w-0">
              {s.icon}
              <p className="text-sm font-body text-slate-800 dark:text-slate-200 leading-snug flex-1">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400
                transition-colors shrink-0 ml-1"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

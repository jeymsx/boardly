import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  headerActions?: React.ReactNode;
}

export const Modal: React.FC<Props> = ({
  open, onClose, title, children, maxWidth = 'max-w-md', headerActions,
}) => {
  const mouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in
        bg-slate-900/50 dark:bg-ink-950/80 backdrop-blur-sm"
      onMouseDown={(e) => { mouseDownOnBackdrop.current = e.target === e.currentTarget; }}
      onMouseUp={(e) => {
        if (mouseDownOnBackdrop.current && e.target === e.currentTarget) onClose();
        mouseDownOnBackdrop.current = false;
      }}
    >
      <div className={`w-full ${maxWidth} bg-white dark:bg-ink-800
        border border-slate-200 dark:border-ink-600/60 rounded-2xl shadow-2xl animate-slide-up
        flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4
          border-b border-slate-100 dark:border-ink-700/60 shrink-0">
          <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100 truncate mr-2">{title}</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            {headerActions}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-ink-700/60 hover:bg-slate-200 dark:hover:bg-ink-600
                flex items-center justify-center text-slate-500 dark:text-slate-400
                hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

import React from 'react';

interface Props {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3 animate-fade-in">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-ink-700/60
      border border-slate-200 dark:border-ink-600/40
      flex items-center justify-center text-slate-400 dark:text-slate-500">
      {icon}
    </div>
    <div>
      <p className="font-display font-semibold text-slate-700 dark:text-slate-300 text-base">{title}</p>
      {description && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">{description}</p>}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<Props> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 font-body">{subtitle}</p>}
    </div>
    {action && <div className="ml-4 shrink-0">{action}</div>}
  </div>
);

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-xs font-body font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full bg-slate-50 dark:bg-ink-900/80
        border ${error ? 'border-rose-400 dark:border-rose-500/60' : 'border-slate-200 dark:border-ink-600/60'}
        rounded-xl px-3.5 py-2.5 text-sm font-body
        text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600
        focus:outline-none focus:ring-2
        ${error ? 'focus:ring-rose-400/30' : 'focus:ring-emerald-500/30'}
        focus:border-emerald-500/50 transition-all ${className}`}
    />
    {hint  && !error && <p className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>}
    {error && <p className="text-[11px] text-rose-500 dark:text-rose-400">{error}</p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-xs font-body font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <select
      {...props}
      className={`w-full bg-slate-50 dark:bg-ink-900/80
        border border-slate-200 dark:border-ink-600/60 rounded-xl px-3.5 py-2.5
        text-sm font-body text-slate-900 dark:text-slate-100
        focus:outline-none focus:ring-2 focus:ring-emerald-500/30
        focus:border-emerald-500/50 transition-all ${className}`}
    >
      {children}
    </select>
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-xs font-body font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <textarea
      {...props}
      className={`w-full bg-slate-50 dark:bg-ink-900/80
        border border-slate-200 dark:border-ink-600/60 rounded-xl px-3.5 py-2.5
        text-sm font-body text-slate-900 dark:text-slate-100
        placeholder-slate-400 dark:placeholder-slate-600 resize-none
        focus:outline-none focus:ring-2 focus:ring-emerald-500/30
        focus:border-emerald-500/50 transition-all ${className}`}
    />
  </div>
);

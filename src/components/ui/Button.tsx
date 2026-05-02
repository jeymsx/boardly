import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:   'bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white font-semibold shadow-glow-emerald/20',
  secondary: 'bg-slate-100 dark:bg-ink-700 hover:bg-slate-200 dark:hover:bg-ink-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-ink-600/60',
  ghost:     'bg-transparent hover:bg-slate-100 dark:hover:bg-ink-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
  danger:    'bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
};

const SIZE_STYLES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-sm px-5 py-3 rounded-xl gap-2',
};

export const Button: React.FC<Props> = ({
  variant = 'secondary', size = 'md',
  icon, loading, fullWidth,
  children, className = '', disabled, ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center font-body font-medium transition-all
      active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
      ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]}
      ${fullWidth ? 'w-full' : ''} ${className}`}
    {...props}
  >
    {loading
      ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      : icon}
    {children}
  </button>
);

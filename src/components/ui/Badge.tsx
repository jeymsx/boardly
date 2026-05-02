import React from 'react';
import type { ReadStatus, AttendanceStatus } from '../../types';

interface StatusBadgeProps {
  status: ReadStatus | AttendanceStatus;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<string, string> = {
  'pending':            'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600/40',
  'in-progress':        'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  'done':               'bg-emerald-50 dark:bg-jade-500/15 text-emerald-700 dark:text-jade-400 border-emerald-200 dark:border-jade-500/30',
  'attended':           'bg-emerald-50 dark:bg-jade-500/15 text-emerald-700 dark:text-jade-400 border-emerald-200 dark:border-jade-500/30',
  'partially-attended': 'bg-emerald-50/60 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/25',
};

const STATUS_LABELS: Record<string, string> = {
  'pending':            'Pending',
  'in-progress':        'In Progress',
  'done':               'Done',
  'attended':           'Attended',
  'partially-attended': 'Partial',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onClick, size = 'sm' }) => {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES['pending'];
  const label  = STATUS_LABELS[status] ?? status;
  const sz     = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5';

  return (
    <button
      onClick={onClick}
      className={`${sz} font-body font-medium rounded-full border inline-flex items-center gap-1
        ${styles} ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : 'cursor-default'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'done' || status === 'attended'
          ? 'bg-emerald-500 dark:bg-jade-400'
          : status === 'in-progress' || status === 'partially-attended'
          ? 'bg-emerald-400 dark:bg-emerald-400'
          : 'bg-slate-400 dark:bg-slate-500'
      }`} />
      {label}
    </button>
  );
};

interface ColorBadgeProps {
  color: string;
  label: string;
  className?: string;
}

export const ColorBadge: React.FC<ColorBadgeProps> = ({ label, className = '' }) => (
  <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${className}`}>
    {label}
  </span>
);

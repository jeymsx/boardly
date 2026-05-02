import React from 'react';

interface Props {
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'jade' | 'sky' | 'rose' | 'violet' | 'orange' | 'teal' | 'pink';
  showLabel?: boolean;
  animate?: boolean;
  gradient?: boolean;
  className?: string;
}

const SIZE_H: Record<string, string> = {
  xs: 'h-1', sm: 'h-1.5', md: 'h-2.5', lg: 'h-4',
};

const TRACK_COLOR: Record<string, string> = {
  emerald: 'bg-emerald-500',
  jade:    'bg-emerald-400',
  sky:     'bg-sky-400',
  rose:    'bg-rose-400',
  violet:  'bg-violet-400',
  orange:  'bg-orange-400',
  teal:    'bg-teal-400',
  pink:    'bg-pink-400',
};

export const ProgressBar: React.FC<Props> = ({
  value, size = 'sm', color = 'emerald',
  showLabel = false, animate = true, gradient = false, className = '',
}) => {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  const h   = SIZE_H[size];
  const fg  = TRACK_COLOR[color] ?? TRACK_COLOR.emerald;

  if (gradient) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex-1 bg-slate-200 dark:bg-ink-700 rounded-full overflow-hidden ${h} relative`}>
          {/* Full-width gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-orange-400 to-emerald-500 rounded-full" />
          {/* Mask covering right portion to reveal only pct% */}
          <div
            className="absolute top-0 bottom-0 right-0 bg-slate-200 dark:bg-ink-700 rounded-r-full transition-all duration-700 ease-out"
            style={{ left: `${pct}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums w-8 text-right">
            {Math.round(pct)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-slate-200 dark:bg-ink-700 rounded-full overflow-hidden ${h}`}>
        <div
          className={`${h} ${fg} rounded-full transition-all duration-700 ease-out ${animate ? 'animate-progress' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums w-8 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};

import React from 'react';
import { Check } from 'lucide-react';
import { SUBJECT_COLORS, type SubjectColor } from '../../types';

const DOT_COLORS: Record<SubjectColor, string> = {
  amber:  'bg-amber-400',
  jade:   'bg-emerald-400',
  sky:    'bg-sky-400',
  rose:   'bg-rose-400',
  violet: 'bg-violet-400',
  orange: 'bg-orange-400',
  teal:   'bg-teal-400',
  pink:   'bg-pink-400',
};

interface Props {
  value: SubjectColor;
  onChange: (c: SubjectColor) => void;
}

export const ColorPicker: React.FC<Props> = ({ value, onChange }) => (
  <div className="flex gap-2 flex-wrap">
    {SUBJECT_COLORS.map(c => (
      <button
        key={c}
        type="button"
        onClick={() => onChange(c)}
        className={`w-8 h-8 rounded-xl ${DOT_COLORS[c]} flex items-center justify-center
          transition-all active:scale-90 ring-2 ring-offset-2
          ring-offset-white dark:ring-offset-ink-800
          ${value === c ? 'ring-slate-400 dark:ring-white/60 scale-110' : 'ring-transparent'}`}
      >
        {value === c && <Check size={14} className="text-white stroke-[3]" />}
      </button>
    ))}
  </div>
);

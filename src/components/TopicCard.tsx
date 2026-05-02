import React, { useState } from 'react';
import { RotateCcw, Pencil, Trash2, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { topicProgress, pctNum } from '../utils/progress';
import { ProgressBar } from './ui/ProgressBar';
import { StatusBadge } from './ui/Badge';
import { COLOR_MAP } from '../types';
import type { Topic, Subject, ReadStatus } from '../types';

const READ_STATUS_ICONS: Record<ReadStatus, string> = {
  'pending': '○', 'in-progress': '◑', 'done': '●',
};

const READ_STATUS_COLORS: Record<ReadStatus, string> = {
  'pending':     'bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-ink-600/40',
  'in-progress': 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  'done':        'bg-emerald-50 dark:bg-jade-500/20 text-emerald-700 dark:text-jade-400 border-emerald-200 dark:border-jade-500/30',
};

const READ_STATUS_DISABLED = 'opacity-40 cursor-not-allowed pointer-events-none';

const BORDER_LEFT: Record<string, string> = {
  amber: 'border-l-amber-500', jade: 'border-l-emerald-500', sky: 'border-l-sky-500',
  rose: 'border-l-rose-500', violet: 'border-l-violet-500', orange: 'border-l-orange-500',
  teal: 'border-l-teal-500', pink: 'border-l-pink-500',
};

interface Props {
  topic: Topic;
  subject: Subject;
  onEdit: (topic: Topic) => void;
  onDelete: (topicId: string) => void;
}

export const TopicCard: React.FC<Props> = ({ topic, subject, onEdit, onDelete }) => {
  const { cycleReadStatus, resetTopicReads } = useSubjectsStore();
  const [expanded, setExpanded] = useState(false);
  const progress    = topicProgress(topic);
  const isComplete  = progress === 1 && topic.reads.length > 0;
  const colorClass  = BORDER_LEFT[subject.color] ?? 'border-l-emerald-500';
  const colors      = COLOR_MAP[subject.color];

  return (
    <div className={`border border-l-2 ${colorClass} ${colors.border} rounded-xl transition-all
      animate-fade-in shadow-card dark:shadow-none overflow-hidden
      ${isComplete ? 'opacity-60' : ''}`}
    >
      {/* Colored header */}
      <div className={`px-4 pt-3.5 pb-3 ${colors.bg}`}>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 text-left group flex-1 min-w-0"
          >
            <span className={`font-body font-medium text-sm leading-tight truncate
              ${colors.text} group-hover:opacity-90 transition-opacity`}>
              {topic.name}
            </span>
            {isComplete && (
              <span className="shrink-0 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400
                bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30
                rounded-full px-2 py-0.5">
                Done
              </span>
            )}
            <span className={`text-[10px] font-mono shrink-0 tabular-nums opacity-70 ${colors.text}`}>
              {pctNum(progress)}%
            </span>
            <span className="text-slate-400 dark:text-slate-500 shrink-0">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(topic)}
              className="w-7 h-7 rounded-lg hover:bg-white/40 dark:hover:bg-ink-700/60
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-90"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDelete(topic.id)}
              className="w-7 h-7 rounded-lg hover:bg-rose-100/60 dark:hover:bg-rose-500/20
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-90"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          {topic.reads.map((read, i) => {
            const isDisabled = i > 0 && topic.reads[i - 1].status !== 'done';
            return (
              <button
                key={read.id}
                onClick={() => !isDisabled && cycleReadStatus(topic.id, i)}
                title={isDisabled ? `Complete Read ${i} first` : `Read ${read.readNumber} — tap to cycle`}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono font-medium
                  transition-all active:scale-90 hover:opacity-80 ${READ_STATUS_COLORS[read.status]}
                  ${isDisabled ? READ_STATUS_DISABLED : ''}`}
              >
                <span>{READ_STATUS_ICONS[read.status]}</span>
                <span>R{read.readNumber}</span>
              </button>
            );
          })}
          <button
            onClick={() => resetTopicReads(topic.id)}
            title="Reset all reads"
            className="w-6 h-6 rounded-lg hover:bg-white/50 dark:hover:bg-ink-700/40
              flex items-center justify-center text-slate-400 dark:text-slate-500
              hover:text-slate-600 dark:hover:text-slate-400 transition-all active:scale-90 ml-auto"
          >
            <RotateCcw size={11} />
          </button>
        </div>

        <ProgressBar value={progress} size="xs" gradient />
      </div>

      {expanded && topic.notes && (
        <div className="px-4 pb-3 border-t border-slate-100 dark:border-ink-700/40 pt-2.5
          bg-white dark:bg-ink-800/60">
          <div className="flex items-start gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <StickyNote size={12} className="mt-0.5 shrink-0" />
            <p className="leading-relaxed">{topic.notes}</p>
          </div>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-3 pt-1 bg-white dark:bg-ink-800/60">
          <div className="grid grid-cols-3 gap-1.5">
            {topic.reads.map(read => (
              <div key={read.id}
                className={`rounded-lg p-2 border text-center ${READ_STATUS_COLORS[read.status]}`}
              >
                <p className="text-[10px] font-mono text-current opacity-70">Read {read.readNumber}</p>
                <StatusBadge status={read.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

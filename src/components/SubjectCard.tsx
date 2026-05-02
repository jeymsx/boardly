import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useSubjectsStore, getTopicsForSubject } from '../store/useSubjectsStore';
import { subjectProgress, pctNum } from '../utils/progress';
import { ProgressBar } from './ui/ProgressBar';
import { TopicCard } from './TopicCard';
import { COLOR_MAP } from '../types';
import type { Subject, Topic } from '../types';

interface Props {
  subject: Subject;
  onEditSubject:   (s: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onAddTopic:      (subjectId: string) => void;
  onEditTopic:     (t: Topic) => void;
  onDeleteTopic:   (topicId: string) => void;
}

export const SubjectCard: React.FC<Props> = ({
  subject, onEditSubject, onDeleteSubject, onAddTopic, onEditTopic, onDeleteTopic,
}) => {
  const { topics } = useSubjectsStore();
  const subjectTopics = getTopicsForSubject(topics, subject.id);
  const progress = subjectProgress(subject, topics);
  const colors   = COLOR_MAP[subject.color];
  const [open, setOpen] = useState(true);

  return (
    <div className={`rounded-2xl border ${colors.border} bg-white dark:bg-ink-800/40
      overflow-hidden transition-all animate-scale-in shadow-card dark:shadow-none`}
    >
      <div className={`px-4 py-3.5 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2.5 flex-1 min-w-0 group"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0`} />
            <span className={`font-display font-semibold text-base ${colors.text}
              group-hover:opacity-90 transition-opacity truncate`}>
              {subject.name}
            </span>
            <span className="text-slate-400 dark:text-slate-600 shrink-0 ml-auto">
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditSubject(subject)}
              className="w-7 h-7 rounded-lg hover:bg-slate-200/60 dark:hover:bg-ink-700/60
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-90"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDeleteSubject(subject.id)}
              className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/15
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-90"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <ProgressBar value={progress} size="sm" gradient className="flex-1" />
          <span className={`text-xs font-mono font-medium ${colors.text} tabular-nums w-8 text-right`}>
            {pctNum(progress)}%
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-600 font-body">
            {subjectTopics.length} topic{subjectTopics.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-2 bg-slate-50/50 dark:bg-transparent">
          {subjectTopics.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <BookOpen size={20} className="text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400 dark:text-slate-600 font-body">No topics yet</p>
            </div>
          ) : (
            subjectTopics.map(topic => (
              <TopicCard
                key={topic.id}
                topic={topic}
                subject={subject}
                onEdit={onEditTopic}
                onDelete={onDeleteTopic}
              />
            ))
          )}

          <button
            onClick={() => onAddTopic(subject.id)}
            className={`mt-1 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border-2
              border-dashed ${colors.border} ${colors.text} text-xs font-body font-medium
              bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-ink-700/40
              transition-all active:scale-[0.98]`}
          >
            <Plus size={14} />
            Add Topic
          </button>
        </div>
      )}
    </div>
  );
};

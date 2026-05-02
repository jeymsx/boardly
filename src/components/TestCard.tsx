import React, { useState } from 'react';
import {
  Pencil, Trash2, Plus, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, Target, Trophy, ExternalLink, Check, X,
} from 'lucide-react';
import { useTestsStore } from '../store/useTestsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { highestScore, latestScore, averageScore, scoreTrend, passedTarget } from '../utils/scores';
import { formatDate } from '../utils/dates';
import { ProgressBar } from './ui/ProgressBar';
import { COLOR_MAP } from '../types';
import type { MasteryTest, ScoreEntry } from '../types';

interface ScoreRowProps {
  score: ScoreEntry;
  targetScore: number;
  testId: string;
}

const ScoreRow: React.FC<ScoreRowProps> = ({ score, targetScore, testId }) => {
  const { deleteScore, updateScore } = useTestsStore();
  const [editing,  setEditing]  = useState(false);
  const [editVal,  setEditVal]  = useState(String(score.score));
  const [editMax,  setEditMax]  = useState(String(score.maxScore));
  const [editLink, setEditLink] = useState(score.link ?? '');

  const pct  = (score.score / score.maxScore) * 100;
  const pass = pct >= targetScore;

  const handleSave = () => {
    const s = parseFloat(editVal);
    const m = parseFloat(editMax);
    if (!isNaN(s) && !isNaN(m) && m > 0) {
      updateScore(testId, score.id, { score: s, maxScore: m, link: editLink || undefined });
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditVal(String(score.score));
    setEditMax(String(score.maxScore));
    setEditLink(score.link ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg
        bg-slate-50 dark:bg-ink-900/60 border border-emerald-300 dark:border-emerald-500/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-10 shrink-0">
            #{score.attemptNumber}
          </span>
          <input
            type="number"
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            className="w-20 bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600/60
              rounded-lg px-2 py-1 text-xs font-mono text-slate-800 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            autoFocus
          />
          <span className="text-xs text-slate-400">/</span>
          <input
            type="number"
            value={editMax}
            onChange={e => setEditMax(e.target.value)}
            className="w-20 bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600/60
              rounded-lg px-2 py-1 text-xs font-mono text-slate-800 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          />
          <div className="ml-auto flex items-center gap-1">
            <button onClick={handleSave}
              className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-500/20
                flex items-center justify-center text-emerald-600 dark:text-emerald-400
                hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
              <Check size={11} />
            </button>
            <button onClick={handleCancel}
              className="w-6 h-6 rounded-md bg-slate-100 dark:bg-ink-700/60
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-slate-600 transition-colors">
              <X size={11} />
            </button>
          </div>
        </div>
        <input
          type="url"
          value={editLink}
          onChange={e => setEditLink(e.target.value)}
          placeholder="Link (optional)"
          className="w-full bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600/60
            rounded-lg px-2 py-1 text-xs font-body text-slate-800 dark:text-slate-200
            placeholder-slate-400 dark:placeholder-slate-600
            focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg
      bg-slate-50 dark:bg-ink-900/40 border border-slate-200 dark:border-ink-700/40">
      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-10 shrink-0">
        #{score.attemptNumber}
      </span>
      <div className="flex-1">
        <ProgressBar value={pct / 100} size="xs" color={pass ? 'jade' : 'rose'} />
      </div>
      <span className={`text-xs font-mono font-semibold tabular-nums w-12 text-right
        ${pass ? 'text-emerald-600 dark:text-jade-400' : 'text-rose-500 dark:text-rose-400'}`}>
        {pct.toFixed(1)}%
      </span>
      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-16 text-right">
        {formatDate(score.date, 'MMM d')}
      </span>
      {score.link && (
        <a href={score.link} target="_blank" rel="noopener noreferrer"
          className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          <ExternalLink size={11} />
        </a>
      )}
      <button
        onClick={() => { setEditVal(String(score.score)); setEditMax(String(score.maxScore)); setEditLink(score.link ?? ''); setEditing(true); }}
        className="w-5 h-5 rounded flex items-center justify-center
          text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
        <Pencil size={10} />
      </button>
      <button
        onClick={() => deleteScore(testId, score.id)}
        className="w-5 h-5 rounded flex items-center justify-center
          text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
        ×
      </button>
    </div>
  );
};

interface Props {
  test: MasteryTest;
  onEdit:     (t: MasteryTest) => void;
  onDelete:   (id: string) => void;
  onAddScore: (t: MasteryTest) => void;
}

export const TestCard: React.FC<Props> = ({ test, onEdit, onDelete, onAddScore }) => {
  const { subjects, topics } = useSubjectsStore();
  const [expanded, setExpanded] = useState(false);

  const subject = test.subjectEnabled !== false && test.subjectId
    ? subjects.find(s => s.id === test.subjectId)
    : undefined;
  const topicDisplay = test.topicLabel
    || (test.topicId ? topics.find(t => t.id === test.topicId)?.name : undefined);

  const colors = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;

  const hi     = highestScore(test.scores);
  const latest = latestScore(test.scores);
  const avg    = averageScore(test.scores);
  const trend  = scoreTrend(test.scores);
  const passed = passedTarget(test.scores, test.targetScore);

  const TrendIcon  = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up'
    ? 'text-emerald-600 dark:text-jade-400'
    : trend === 'down'
    ? 'text-rose-500 dark:text-rose-400'
    : 'text-slate-400 dark:text-slate-500';

  return (
    <div className={`bg-white dark:bg-ink-800/60 border ${colors.border} rounded-xl
      transition-all hover:shadow-card-hover dark:hover:border-opacity-70
      animate-fade-in overflow-hidden shadow-card dark:shadow-none`}
    >
      <div className={`px-4 py-3.5 ${colors.bg}`}>
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-1 min-w-0 text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              {passed && <Trophy size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0" />}
              <span className={`font-display font-semibold text-sm
                group-hover:opacity-90 transition-opacity leading-tight truncate ${colors.text}`}>
                {test.name}
              </span>
              {test.link && (
                <a href={test.link} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <ExternalLink size={12} />
                </a>
              )}
              <span className="text-slate-400 dark:text-slate-600 ml-auto shrink-0">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {subject && <span className={`text-xs ${colors.text} font-body opacity-80`}>{subject.name}</span>}
              {topicDisplay && <span className="text-xs text-slate-400 dark:text-slate-600">• {topicDisplay}</span>}
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(test)}
              className="w-7 h-7 rounded-lg hover:bg-white/40 dark:hover:bg-ink-700/60
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-90">
              <Pencil size={12} />
            </button>
            <button onClick={() => onDelete(test.id)}
              className="w-7 h-7 rounded-lg hover:bg-rose-100/60 dark:hover:bg-rose-500/20
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-90">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2.5">
          <div className="flex items-center gap-1.5">
            <Target size={12} className="text-slate-400 dark:text-slate-600" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Target: {test.targetScore}%</span>
          </div>
          {latest !== null && (
            <div className="flex items-center gap-1">
              <TrendIcon size={12} className={trendColor} />
              <span className={`text-xs font-mono font-semibold ${trendColor}`}>{latest.toFixed(1)}%</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            {avg !== null && (
              <span className="text-xs font-mono text-slate-500 dark:text-slate-500">
                Avg: {avg.toFixed(1)}%
              </span>
            )}
            {hi !== null && (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                Best: {hi.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {latest !== null && (
          <div className="mt-2">
            <ProgressBar value={latest / 100} size="xs" color={passed ? 'jade' : subject?.color as any ?? 'emerald'} />
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-ink-700/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-body font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Score History ({test.scores.length} take{test.scores.length !== 1 ? 's' : ''})
            </p>
            <button
              onClick={() => onAddScore(test)}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400
                hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-body font-medium"
            >
              <Plus size={12} />
              Add Score
            </button>
          </div>

          {test.scores.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-600 py-2">No scores recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {[...test.scores].reverse().map(score => (
                <ScoreRow key={score.id} score={score} targetScore={test.targetScore} testId={test.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

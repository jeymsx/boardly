import React, { useState, useEffect } from 'react';
import {
  Pencil, Trash2, TrendingUp, TrendingDown, Minus,
  Target, Trophy, ExternalLink,
} from 'lucide-react';
import { useTestsStore } from '../store/useTestsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useToastStore } from '../store/useToastStore';
import { highestScore, latestScore, averageScore, scoreTrend, passedTarget } from '../utils/scores';
import { formatDate } from '../utils/dates';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { COLOR_MAP } from '../types';
import type { MasteryTest, ScoreEntry } from '../types';

const inputCls = `w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
  rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-600
  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all`;

// ─── Score Edit Modal ─────────────────────────────────────────────────────────

interface ScoreEditModalProps {
  score: ScoreEntry;
  testId: string;
  open: boolean;
  onClose: () => void;
}

const ScoreEditModal: React.FC<ScoreEditModalProps> = ({ score, testId, open, onClose }) => {
  const { updateScore } = useTestsStore();
  const [editVal,  setEditVal]  = useState(String(score.score));
  const [editMax,  setEditMax]  = useState(String(score.maxScore));
  const [editLink, setEditLink] = useState(score.link ?? '');

  useEffect(() => {
    if (open) {
      setEditVal(String(score.score));
      setEditMax(String(score.maxScore));
      setEditLink(score.link ?? '');
    }
  }, [open, score.score, score.maxScore, score.link]);

  const handleSave = () => {
    const s = parseFloat(editVal);
    const m = parseFloat(editMax);
    if (!isNaN(s) && !isNaN(m) && m > 0) {
      updateScore(testId, score.id, { score: s, maxScore: m, link: editLink || undefined });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit Take #${score.attemptNumber}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-body text-slate-500 dark:text-slate-400 mb-1.5 block">Score</label>
            <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus className={inputCls} />
          </div>
          <span className="text-slate-400 font-mono pb-2.5">/</span>
          <div className="flex-1">
            <label className="text-xs font-body text-slate-500 dark:text-slate-400 mb-1.5 block">Max Score</label>
            <input type="number" value={editMax} onChange={e => setEditMax(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-body text-slate-500 dark:text-slate-400 mb-1.5 block">Link (optional)</label>
          <input type="url" value={editLink} onChange={e => setEditLink(e.target.value)}
            placeholder="https://..." className={inputCls} />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600/60
              text-sm font-body text-slate-600 dark:text-slate-400
              hover:bg-slate-50 dark:hover:bg-ink-700/40 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600
              text-sm font-body font-medium text-white transition-colors active:scale-[0.98]">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteConfirmProps {
  open: boolean;
  label: string;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmProps> = ({ open, label, onConfirm, onClose }) => (
  <Modal open={open} onClose={onClose} title="Delete Score">
    <div className="flex flex-col gap-4">
      <p className="text-sm font-body text-slate-600 dark:text-slate-400 leading-relaxed">{label}</p>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600/60
            text-sm font-body text-slate-600 dark:text-slate-400
            hover:bg-slate-50 dark:hover:bg-ink-700/40 transition-colors">
          Cancel
        </button>
        <button onClick={() => { onConfirm(); onClose(); }}
          className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600
            text-sm font-body font-medium text-white transition-colors active:scale-[0.98]">
          Delete
        </button>
      </div>
    </div>
  </Modal>
);

// ─── Score Row ────────────────────────────────────────────────────────────────

interface ScoreRowProps {
  score: ScoreEntry;
  targetScore: number;
  testId: string;
  isBest: boolean;
}

const ScoreRow: React.FC<ScoreRowProps> = ({ score, targetScore, testId, isBest }) => {
  const { deleteScore } = useTestsStore();
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const pct  = (score.score / score.maxScore) * 100;
  const pass = pct >= targetScore;

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg
        bg-slate-50 dark:bg-ink-900/40 border border-slate-200 dark:border-ink-700/40">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-8 shrink-0">
          #{score.attemptNumber}
        </span>
        {isBest && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold
            bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400
            border border-amber-200 dark:border-amber-500/25 shrink-0">
            <Trophy size={8} />
            Best
          </span>
        )}
        <div className="flex-1 min-w-0">
          <ProgressBar value={pct / 100} size="xs" color={pass ? 'jade' : 'rose'} />
        </div>
        <span className={`text-xs font-mono font-semibold tabular-nums w-12 text-right
          ${pass ? 'text-emerald-600 dark:text-jade-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {pct.toFixed(1)}%
        </span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-14 text-right shrink-0">
          {formatDate(score.date, 'MMM d')}
        </span>
        {score.link && (
          <a href={score.link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium
              bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400
              border border-emerald-200 dark:border-emerald-500/25
              hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors shrink-0">
            <ExternalLink size={9} />
            Link
          </a>
        )}
        <button onClick={() => setEditOpen(true)}
          className="w-5 h-5 rounded flex items-center justify-center
            text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
          <Pencil size={10} />
        </button>
        <button onClick={() => setDeleteOpen(true)}
          className="w-5 h-5 rounded flex items-center justify-center
            text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
          <Trash2 size={10} />
        </button>
      </div>
      <ScoreEditModal score={score} testId={testId} open={editOpen} onClose={() => setEditOpen(false)} />
      <DeleteConfirmModal
        open={deleteOpen}
        label={`Delete Take #${score.attemptNumber} (${pct.toFixed(1)}%)? This cannot be undone.`}
        onConfirm={() => deleteScore(testId, score.id)}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
};

// ─── Test Detail Modal ────────────────────────────────────────────────────────

interface TestDetailModalProps {
  test: MasteryTest;
  open: boolean;
  onClose: () => void;
  onEdit: (t: MasteryTest) => void;
  onDelete: (id: string) => void;
}

const TestDetailModal: React.FC<TestDetailModalProps> = ({
  test, open, onClose, onEdit, onDelete,
}) => {
  const { addScore } = useTestsStore();
  const { subjects } = useSubjectsStore();
  const { addToast } = useToastStore();
  const [score,    setScore]    = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [notes,    setNotes]    = useState('');
  const [link,     setLink]     = useState('');

  React.useEffect(() => {
    if (open) { setScore(''); setMaxScore('100'); setNotes(''); setLink(''); }
  }, [open]);

  const subject = test.subjectEnabled !== false && test.subjectId
    ? subjects.find(s => s.id === test.subjectId)
    : undefined;
  const topicDisplay = test.topicLabel;
  const colors = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;

  const hi     = highestScore(test.scores);
  const latest = latestScore(test.scores);
  const avg    = averageScore(test.scores);

  const bestPct = test.scores.length > 0
    ? Math.max(...test.scores.map(s => s.score / s.maxScore))
    : -Infinity;

  const pctPreview = score && maxScore
    ? ((parseFloat(score) / parseFloat(maxScore)) * 100).toFixed(1)
    : null;

  const handleAdd = () => {
    const s = parseFloat(score);
    const m = parseFloat(maxScore);
    if (isNaN(s) || isNaN(m) || m <= 0) return;
    addScore(test.id, s, m, notes || undefined, link || undefined);
    const pct = ((s / m) * 100).toFixed(1);
    addToast(`Score recorded: ${pct}%`);
    setScore(''); setMaxScore('100'); setNotes(''); setLink('');
  };

  return (
    <Modal open={open} onClose={onClose} title={test.name}>
      <div className="flex flex-col gap-4">

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-1.5">
          {subject && <span className={`text-xs font-body font-medium ${colors.text}`}>{subject.name}</span>}
          {topicDisplay && <span className="text-xs text-slate-400 dark:text-slate-600">• {topicDisplay}</span>}
          {test.link && (
            <a
              href={test.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium
                bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400
                border border-emerald-200 dark:border-emerald-500/25 hover:bg-emerald-100 transition-colors"
            >
              <ExternalLink size={9} />
              Link
            </a>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-ink-900/40
          border border-slate-200 dark:border-ink-700/40 flex-wrap">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">Target</span>
            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{test.targetScore}%</span>
          </div>
          {latest !== null && (
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">Latest</span>
              <span className={`text-sm font-mono font-bold ${latest >= test.targetScore ? 'text-emerald-600 dark:text-jade-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {latest.toFixed(1)}%
              </span>
            </div>
          )}
          {avg !== null && (
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">Avg</span>
              <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{avg.toFixed(1)}%</span>
            </div>
          )}
          {hi !== null && (
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">Best</span>
              <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{hi.toFixed(1)}%</span>
            </div>
          )}
          <div className="flex flex-col ml-auto text-right">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">Takes</span>
            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{test.scores.length}</span>
          </div>
        </div>

        {/* Score history */}
        {test.scores.length > 0 && (
          <div>
            <p className="text-xs font-body font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Score History
            </p>
            <div className="flex flex-col gap-1.5">
              {[...test.scores].reverse().map(sc => {
                const pct = sc.score / sc.maxScore;
                const isBest = test.scores.length > 1 && Math.abs(pct - bestPct) < 1e-9;
                return (
                  <ScoreRow key={sc.id} score={sc} targetScore={test.targetScore} testId={test.id} isBest={isBest} />
                );
              })}
            </div>
          </div>
        )}

        {/* Add Score */}
        <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-ink-700/40">
          <p className="text-xs font-body font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Add Score
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Score"
              value={score}
              onChange={e => setScore(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
                placeholder-slate-400 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
            <span className="text-slate-400 dark:text-slate-500 font-mono">/</span>
            <input
              type="number"
              placeholder="Max"
              value={maxScore}
              onChange={e => setMaxScore(e.target.value)}
              className="w-24 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
                placeholder-slate-400 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
            {pctPreview && (
              <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 w-16 text-right shrink-0">
                {pctPreview}%
              </span>
            )}
          </div>
          {pctPreview && (
            <div className="bg-slate-100 dark:bg-ink-900/60 border border-slate-200 dark:border-ink-700/40 rounded-xl px-4 py-3 text-center">
              <span className="font-mono font-bold text-2xl text-emerald-600 dark:text-emerald-400">{pctPreview}%</span>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                {parseFloat(pctPreview) >= test.targetScore ? '✓ Passes target' : `✗ Below ${test.targetScore}% target`}
              </p>
            </div>
          )}
          <input
            type="url"
            placeholder="Link (optional)"
            value={link}
            onChange={e => setLink(e.target.value)}
            className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
              rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-600
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
              rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-600
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!score || !maxScore}
            className="w-full py-2.5 rounded-xl text-sm font-body font-medium
              bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors active:scale-[0.98]"
          >
            Record Score
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" fullWidth onClick={() => { onClose(); onEdit(test); }}>
            Edit Test
          </Button>
          <Button variant="danger" fullWidth onClick={() => { onClose(); onDelete(test.id); }}>
            Delete
          </Button>
        </div>

      </div>
    </Modal>
  );
};

// ─── Test Card ────────────────────────────────────────────────────────────────

interface Props {
  test: MasteryTest;
  onEdit:   (t: MasteryTest) => void;
  onDelete: (id: string) => void;
}

export const TestCard: React.FC<Props> = ({ test, onEdit, onDelete }) => {
  const { subjects } = useSubjectsStore();
  const [detailOpen, setDetailOpen] = useState(false);

  const subject = test.subjectEnabled !== false && test.subjectId
    ? subjects.find(s => s.id === test.subjectId)
    : undefined;
  const topicDisplay = test.topicLabel
    || (test.topicId ? undefined : undefined);

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
    <>
      <div
        className={`bg-white dark:bg-ink-800/60 border ${colors.border} rounded-xl
          transition-all hover:shadow-card-hover dark:hover:border-opacity-70
          animate-fade-in overflow-hidden shadow-card dark:shadow-none cursor-pointer`}
        onClick={() => setDetailOpen(true)}
      >
        <div className={`px-4 py-3.5 ${colors.bg}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {passed && <Trophy size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0" />}
                <span className={`font-display font-semibold text-sm leading-tight truncate ${colors.text}`}>
                  {test.name}
                </span>
                {test.link && (
                  <a href={test.link} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium shrink-0
                      bg-white/60 dark:bg-ink-700/60 text-slate-500 dark:text-slate-400
                      border border-slate-200 dark:border-ink-600/40
                      hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/30
                      transition-colors">
                    <ExternalLink size={9} />
                    Link
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {subject && <span className={`text-xs ${colors.text} font-body opacity-80`}>{subject.name}</span>}
                {topicDisplay && <span className="text-xs text-slate-400 dark:text-slate-600">• {topicDisplay}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); onEdit(test); }}
                className="w-7 h-7 rounded-lg hover:bg-white/40 dark:hover:bg-ink-700/60
                  flex items-center justify-center text-slate-400 dark:text-slate-500
                  hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-90"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(test.id); }}
                className="w-7 h-7 rounded-lg hover:bg-rose-100/60 dark:hover:bg-rose-500/20
                  flex items-center justify-center text-slate-400 dark:text-slate-500
                  hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-90"
              >
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
      </div>

      <TestDetailModal
        test={test}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Pencil, Trash2, Target, Trophy, ExternalLink,
} from 'lucide-react';
import { useTestsStore } from '../store/useTestsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useTestTagsStore } from '../store/useTestTagsStore';
import { useToastStore } from '../store/useToastStore';
import { highestScore, latestScore, averageScore, passedTarget } from '../utils/scores';
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
            <input type="number" value={editVal} onChange={e => {
              const s = parseFloat(e.target.value);
              const m = parseFloat(editMax);
              setEditVal(!isNaN(s) && !isNaN(m) && m > 0 && s > m ? String(m) : e.target.value);
            }} autoFocus className={inputCls} />
          </div>
          <span className="text-slate-400 font-mono pb-2.5">/</span>
          <div className="flex-1">
            <label className="text-xs font-body text-slate-500 dark:text-slate-400 mb-1.5 block">Max Score</label>
            <input type="number" value={editMax} onChange={e => {
              setEditMax(e.target.value);
              const m = parseFloat(e.target.value);
              const s = parseFloat(editVal);
              if (!isNaN(s) && !isNaN(m) && m > 0 && s > m) setEditVal(String(m));
            }} className={inputCls} />
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
  const { tags: allTags } = useTestTagsStore();
  const { addToast } = useToastStore();
  const [score,    setScore]    = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [notes,    setNotes]    = useState('');
  const [link,     setLink]     = useState('');

  React.useEffect(() => {
    if (open) { setScore(''); setMaxScore('100'); setNotes(''); setLink(''); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return;
      onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

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
    ? (() => {
        const s = parseFloat(score);
        const m = parseFloat(maxScore);
        if (isNaN(s) || isNaN(m) || m === 0) return null;
        return ((s / m) * 100).toFixed(1);
      })()
    : null;

  const resolvedTags = (test.tags ?? []).map(id => allTags.find(t => t.id === id)).filter(Boolean) as { id: string; name: string }[];

  const handleAdd = () => {
    const s = parseFloat(score);
    const m = parseFloat(maxScore);
    if (isNaN(s) || isNaN(m) || m <= 0) return;
    addScore(test.id, s, m, notes || undefined, link || undefined);
    const pct = ((s / m) * 100).toFixed(1);
    addToast(`Score recorded: ${pct}%`);
    setScore(''); setMaxScore('100'); setNotes(''); setLink('');
  };

  const headerActions = (
    <>
      <button
        onClick={() => { onClose(); onEdit(test); }}
        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-ink-700/60 hover:bg-slate-200 dark:hover:bg-ink-600
          flex items-center justify-center text-slate-500 dark:text-slate-400
          hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95"
        title="Edit test"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={() => { onClose(); onDelete(test.id); }}
        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-ink-700/60 hover:bg-rose-100 dark:hover:bg-rose-500/20
          flex items-center justify-center text-slate-500 dark:text-slate-400
          hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95"
        title="Delete test"
      >
        <Trash2 size={14} />
      </button>
    </>
  );

  const statsItems = [
    {
      label: 'Target',
      value: `${test.targetScore}%`,
      cls: 'text-slate-700 dark:text-slate-300',
    },
    {
      label: 'Latest',
      value: latest !== null ? `${latest.toFixed(1)}%` : '—',
      cls: latest !== null
        ? latest >= test.targetScore
          ? 'text-emerald-600 dark:text-jade-400'
          : 'text-rose-500 dark:text-rose-400'
        : 'text-slate-400 dark:text-slate-600',
    },
    {
      label: 'Average',
      value: avg !== null ? `${avg.toFixed(1)}%` : '—',
      cls: 'text-slate-700 dark:text-slate-300',
    },
    {
      label: 'Best',
      value: hi !== null ? `${hi.toFixed(1)}%` : '—',
      cls: hi !== null ? 'text-emerald-600 dark:text-jade-400' : 'text-slate-400 dark:text-slate-600',
    },
    {
      label: 'Total Takes',
      value: String(test.scores.length),
      cls: 'text-slate-700 dark:text-slate-300',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={test.name} headerActions={headerActions} maxWidth="max-w-4xl">
      {/* Two-column landscape layout */}
      <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-0">

        {/* Left: meta + stats + history */}
        <div className="flex flex-col gap-4 pr-0 sm:pr-6">

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-1.5">
            {subject && <span className={`text-xs font-body font-semibold ${colors.text}`}>{subject.name}</span>}
            {topicDisplay && <span className="text-xs text-slate-400 dark:text-slate-600">• {topicDisplay}</span>}
            {resolvedTags.map(tag => (
              <span key={tag.id} className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium capitalize
                bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500
                border border-slate-200 dark:border-ink-600/40">
                {tag.name}
              </span>
            ))}
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

          {/* Stats grid */}
          <div className="grid grid-cols-5 rounded-xl border border-slate-200 dark:border-ink-700/40
            bg-slate-50 dark:bg-ink-900/40 divide-x divide-slate-200 dark:divide-ink-700/40">
            {statsItems.map(({ label, value, cls }) => (
              <div key={label} className="flex flex-col items-center justify-center py-3 px-1 gap-0.5">
                <span className="text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider text-center leading-tight">
                  {label}
                </span>
                <span className={`text-sm font-mono font-bold ${cls}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Score history */}
          <div className="flex-1">
            <p className="text-xs font-body font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Score History
            </p>
            {test.scores.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-600 py-2">No scores recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {[...test.scores].reverse().map(sc => {
                  const pct = sc.score / sc.maxScore;
                  const isBest = test.scores.length > 1 && Math.abs(pct - bestPct) < 1e-9;
                  return (
                    <ScoreRow key={sc.id} score={sc} targetScore={test.targetScore} testId={test.id} isBest={isBest} />
                  );
                })}
              </div>
            )}
          </div>

          {/* Done — desktop only left panel */}
          <div className="hidden sm:block mt-auto pt-2">
            <Button variant="ghost" fullWidth onClick={onClose}>Done</Button>
          </div>
        </div>

        {/* Right: add score form */}
        <div className="border-t border-slate-100 dark:border-ink-700/40 pt-4 mt-4
          sm:border-t-0 sm:pt-0 sm:mt-0 sm:border-l sm:pl-6 flex flex-col gap-3">

          <p className="text-xs font-body font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Add Score
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-body text-slate-400 dark:text-slate-500 mb-1 block">Score</label>
              <input
                type="number"
                placeholder="Score"
                value={score}
                onChange={e => {
                  const s = parseFloat(e.target.value);
                  const m = parseFloat(maxScore);
                  setScore(!isNaN(s) && !isNaN(m) && m > 0 && s > m ? String(m) : e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                  rounded-xl px-3 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
                  placeholder-slate-400 dark:placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
              />
            </div>
            <span className="text-slate-400 dark:text-slate-500 font-mono mt-5">/</span>
            <div className="w-20">
              <label className="text-[10px] font-body text-slate-400 dark:text-slate-500 mb-1 block">Max</label>
              <input
                type="number"
                placeholder="100"
                value={maxScore}
                onChange={e => {
                  setMaxScore(e.target.value);
                  const m = parseFloat(e.target.value);
                  const s = parseFloat(score);
                  if (!isNaN(s) && !isNaN(m) && m > 0 && s > m) setScore(String(m));
                }}
                className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                  rounded-xl px-3 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
                  placeholder-slate-400 dark:placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          {pctPreview ? (
            <div className="rounded-xl border border-slate-200 dark:border-ink-700/40
              bg-slate-50 dark:bg-ink-900/60 px-4 py-3 text-center">
              <span className={`font-mono font-bold text-3xl ${parseFloat(pctPreview) >= test.targetScore
                ? 'text-emerald-600 dark:text-jade-400'
                : 'text-rose-500 dark:text-rose-400'}`}>
                {pctPreview}%
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                {parseFloat(pctPreview) >= test.targetScore ? '✓ Passes target' : `✗ Below ${test.targetScore}% target`}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-ink-700/40 px-4 py-4 text-center">
              <span className="text-slate-300 dark:text-slate-700 font-mono text-2xl font-bold">—%</span>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">Enter score above</p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-body text-slate-400 dark:text-slate-500 mb-1 block">Link (optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={link}
              onChange={e => setLink(e.target.value)}
              className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                rounded-xl px-3 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
                placeholder-slate-400 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-body text-slate-400 dark:text-slate-500 mb-1 block">Notes (optional)</label>
            <textarea
              placeholder="Add notes about this attempt..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                rounded-xl px-3 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
                placeholder-slate-400 dark:placeholder-slate-600 resize-none
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!score || !maxScore}
            className="w-full py-2.5 rounded-xl text-sm font-body font-medium
              bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors active:scale-[0.98]"
          >
            Record Score
          </button>
        </div>
      </div>

      {/* Done — mobile only */}
      <div className="sm:hidden pt-4 mt-2 border-t border-slate-100 dark:border-ink-700/40">
        <Button variant="ghost" fullWidth onClick={onClose}>Done</Button>
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

export const TestCard = React.memo<Props>(({ test, onEdit, onDelete }) => {
  const { subjects } = useSubjectsStore();
  const { tags: allTags } = useTestTagsStore();
  const [detailOpen, setDetailOpen] = useState(false);

  const subject = test.subjectEnabled !== false && test.subjectId
    ? subjects.find(s => s.id === test.subjectId)
    : undefined;
  const topicDisplay = test.topicLabel;

  const colors = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;

  const hi     = highestScore(test.scores);
  const latest = latestScore(test.scores);
  const avg    = averageScore(test.scores);
  const passed = passedTarget(test.scores, test.targetScore);

  const resolvedTags = (test.tags ?? []).map(id => allTags.find(t => t.id === id)).filter(Boolean) as { id: string; name: string }[];

  return (
    <>
      <div
        className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50 rounded-xl
          transition-all hover:shadow-card-hover hover:-translate-y-0.5 animate-fade-in overflow-hidden shadow-card dark:shadow-none cursor-pointer"
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex">
          {/* Left subject color accent */}
          <div className={`w-[3px] shrink-0 self-stretch ${colors.dot}`} />

          <div className="flex-1 px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 min-w-0">
                  {passed && <Trophy size={13} className="text-emerald-500 dark:text-emerald-400 shrink-0" />}
                  <span className="font-display font-semibold text-sm leading-tight truncate min-w-0 text-slate-800 dark:text-slate-200">
                    <span className="sm:hidden">{test.name.length > 25 ? test.name.slice(0, 25) + '…' : test.name}</span>
                    <span className="hidden sm:inline">{test.name}</span>
                  </span>
                  {test.link && (
                    <a href={test.link} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium shrink-0
                        bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
                        border border-emerald-200 dark:border-emerald-500/25 hover:bg-emerald-100 transition-colors">
                      <ExternalLink size={9} />
                      Link
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {subject && (
                    <span className={`text-xs font-body font-medium ${colors.text}`}>{subject.name}</span>
                  )}
                  {topicDisplay && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">• {topicDisplay}</span>
                  )}
                  {resolvedTags.map(tag => (
                    <span key={tag.id} className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium capitalize
                      bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500
                      border border-slate-200 dark:border-ink-600/40">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); onEdit(test); }}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-ink-600/50 bg-slate-50 dark:bg-ink-900/40
                    flex items-center justify-center text-slate-400 dark:text-slate-500
                    hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 transition-all active:scale-90"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(test.id); }}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-ink-600/50 bg-slate-50 dark:bg-ink-900/40
                    flex items-center justify-center text-slate-400 dark:text-slate-500
                    hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all active:scale-90"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2.5">
              <div className="flex items-center gap-1.5 shrink-0">
                <Target size={12} className="text-slate-400 dark:text-slate-600" />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Target: {test.targetScore}%</span>
              </div>
              <div className="flex items-center gap-2">
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
                <ProgressBar value={latest / 100} size="xs" color={passed ? 'jade' : (subject?.color === 'amber' ? 'orange' : subject?.color) ?? 'emerald'} />
              </div>
            )}
          </div>
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
});

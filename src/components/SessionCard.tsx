import React, { useState, useEffect } from 'react';
import {
  Pencil, Trash2, RefreshCw,
  ExternalLink, ToggleLeft, ToggleRight, Calendar, FlaskConical, Plus, Check, X,
} from 'lucide-react';
import { useSessionsStore } from '../store/useSessionsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTagsStore } from '../store/useTagsStore';
import { useToastStore } from '../store/useToastStore';
import { ATTENDANCE_STATUS_ORDER, READ_STATUS_ORDER } from '../types';
import { sessionProgress, pctNum } from '../utils/progress';
import { averageScore, highestScore } from '../utils/scores';
import { formatDate, isToday, isPast } from '../utils/dates';
import { ProgressBar } from './ui/ProgressBar';
import { StatusBadge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { COLOR_MAP } from '../types';
import type { Session, WeeklyScore } from '../types';

const REVIEW_STATUS_COLORS: Record<string, string> = {
  'pending':     'bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-ink-600/40',
  'in-progress': 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  'done':        'bg-emerald-50 dark:bg-jade-500/20 text-emerald-700 dark:text-jade-400 border-emerald-200 dark:border-jade-500/30',
};

const inputCls = `w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
  rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-600
  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all`;

// ─── Weekly Score Edit Modal ──────────────────────────────────────────────────

interface WeeklyScoreEditModalProps {
  sc: WeeklyScore;
  sessionId: string;
  open: boolean;
  onClose: () => void;
}

const WeeklyScoreEditModal: React.FC<WeeklyScoreEditModalProps> = ({ sc, sessionId, open, onClose }) => {
  const { updateWeeklyScore } = useSessionsStore();
  const [editVal,  setEditVal]  = useState(String(sc.score));
  const [editMax,  setEditMax]  = useState(String(sc.maxScore));
  const [editLink, setEditLink] = useState(sc.link ?? '');

  useEffect(() => {
    if (open) {
      setEditVal(String(sc.score));
      setEditMax(String(sc.maxScore));
      setEditLink(sc.link ?? '');
    }
  }, [open, sc.score, sc.maxScore, sc.link]);

  const handleSave = () => {
    const s = parseFloat(editVal);
    const m = parseFloat(editMax);
    if (!isNaN(s) && !isNaN(m) && m > 0) {
      updateWeeklyScore(sessionId, sc.id, { score: s, maxScore: m, link: editLink || undefined });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit Take #${sc.attemptNumber}`}>
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

// ─── Weekly Score Row ─────────────────────────────────────────────────────────

interface WeeklyScoreRowProps { sc: WeeklyScore; sessionId: string; isBest: boolean; }

const WeeklyScoreRow: React.FC<WeeklyScoreRowProps> = ({ sc, sessionId, isBest }) => {
  const { deleteWeeklyScore } = useSessionsStore();
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const pct = (sc.score / sc.maxScore) * 100;

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg
        bg-slate-50 dark:bg-ink-900/40 border border-slate-200 dark:border-ink-700/40">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-6 shrink-0">#{sc.attemptNumber}</span>
        {isBest && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold
            bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400
            border border-amber-200 dark:border-amber-500/25 shrink-0">
            Best
          </span>
        )}
        <div className="flex-1 min-w-0">
          <ProgressBar value={pct / 100} size="xs" color="emerald" />
        </div>
        <span className="text-xs font-mono font-semibold tabular-nums w-12 text-right text-slate-700 dark:text-slate-300">
          {pct.toFixed(1)}%
        </span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-14 text-right shrink-0">
          {formatDate(sc.date, 'MMM d')}
        </span>
        {sc.link && (
          <a href={sc.link} target="_blank" rel="noopener noreferrer"
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
      <WeeklyScoreEditModal sc={sc} sessionId={sessionId} open={editOpen} onClose={() => setEditOpen(false)} />
      <DeleteConfirmModal
        open={deleteOpen}
        label={`Delete Take #${sc.attemptNumber} (${pct.toFixed(1)}%)? This cannot be undone.`}
        onConfirm={() => deleteWeeklyScore(sessionId, sc.id)}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
};

// ─── Weekly Test Modal ────────────────────────────────────────────────────────

interface WeeklyTestModalProps {
  session: Session;
  open: boolean;
  onClose: () => void;
}

const WeeklyTestModal: React.FC<WeeklyTestModalProps> = ({ session, open, onClose }) => {
  const { addWeeklyScore, updateWeeklyTest } = useSessionsStore();
  const [score,    setScore]    = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [notes,    setNotes]    = useState('');
  const [link,     setLink]     = useState('');
  const [wtLink,   setWtLink]   = useState(session.weeklyTest?.link ?? '');

  React.useEffect(() => {
    if (open) setWtLink(session.weeklyTest?.link ?? '');
  }, [open, session.weeklyTest?.link]);

  const wt     = session.weeklyTest ?? { scores: [] };
  const scores = wt.scores as WeeklyScore[];
  const fakeEntries = scores.map(s => ({ ...s, testId: session.id }));
  const avg  = averageScore(fakeEntries as any);
  const best = highestScore(fakeEntries as any);

  const bestPct = scores.length > 0
    ? Math.max(...scores.map(s => s.score / s.maxScore))
    : -Infinity;

  const pctPreview = score && maxScore
    ? ((parseFloat(score) / parseFloat(maxScore)) * 100).toFixed(1)
    : null;

  const handleAdd = () => {
    const s = parseFloat(score);
    const m = parseFloat(maxScore);
    if (isNaN(s) || isNaN(m) || m <= 0) return;
    addWeeklyScore(session.id, { score: s, maxScore: m, notes: notes || undefined, link: link || undefined });
    setScore(''); setMaxScore('100'); setNotes(''); setLink('');
  };

  const handleLinkBlur = () => {
    if (wtLink !== (session.weeklyTest?.link ?? '')) {
      updateWeeklyTest(session.id, { link: wtLink || undefined });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Weekly Test — ${session.topicLabel}`}>
      <div className="flex flex-col gap-4">

        <div className="flex gap-2 items-center">
          <input
            type="url"
            value={wtLink}
            onChange={e => setWtLink(e.target.value)}
            onBlur={handleLinkBlur}
            placeholder="Test link (optional)"
            className={inputCls}
          />
          {wtLink && (
            <a
              href={wtLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-body font-medium
                bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300
                border border-emerald-200 dark:border-emerald-500/25
                hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors shrink-0"
            >
              <ExternalLink size={13} />
              Open
            </a>
          )}
        </div>

        {scores.length >= 2 && (
          <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-ink-900/40
            border border-slate-200 dark:border-ink-700/40">
            {best !== null && (
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">Best</span>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{best.toFixed(1)}%</span>
              </div>
            )}
            {avg !== null && (
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">Avg</span>
                <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{avg.toFixed(1)}%</span>
              </div>
            )}
            <div className="flex flex-col ml-auto text-right">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">Takes</span>
              <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{scores.length}</span>
            </div>
          </div>
        )}

        {scores.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {scores.map(sc => {
              const pct = sc.score / sc.maxScore;
              const isBest = scores.length > 1 && Math.abs(pct - bestPct) < 1e-9;
              return <WeeklyScoreRow key={sc.id} sc={sc} sessionId={session.id} isBest={isBest} />;
            })}
          </div>
        )}

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
                rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
            <span className="text-slate-400 dark:text-slate-500 font-mono">/</span>
            <input
              type="number"
              placeholder="Max"
              value={maxScore}
              onChange={e => setMaxScore(e.target.value)}
              className="w-24 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
            {pctPreview && (
              <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 w-16 text-right shrink-0">
                {pctPreview}%
              </span>
            )}
          </div>
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

      </div>
    </Modal>
  );
};

// ─── Session Detail Modal ─────────────────────────────────────────────────────

interface SessionDetailModalProps {
  session: Session;
  open: boolean;
  onClose: () => void;
  onEdit: (s: Session) => void;
  onDelete: (id: string) => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session, open, onClose, onEdit, onDelete,
}) => {
  const {
    cycleAttendance, cycleReviewStatus, regenerateReviews,
    toggleReviewDate, setReviewDate, addReview, deleteReview,
  } = useSessionsStore();
  const { subjects } = useSubjectsStore();
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [weeklyTestOpen,   setWeeklyTestOpen]   = useState(false);
  const [editingDateIndex, setEditingDateIndex] = useState<number | null>(null);
  const [tempDate,         setTempDate]         = useState('');
  const [deleteReviewId,   setDeleteReviewId]   = useState<string | null>(null);

  const { tags: allTags } = useTagsStore();

  const subject  = (session.subjectEnabled !== false) ? subjects.find(s => s.id === session.subjectId) : undefined;
  const colors   = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
  const progress = sessionProgress(session);
  const resolvedTags = (session.tags ?? []).map(id => allTags.find(t => t.id === id)).filter(Boolean) as { id: string; name: string }[];

  const handleDateEdit = (i: number, currentDate: string | null) => {
    setEditingDateIndex(i);
    setTempDate(currentDate ?? '');
  };

  const handleDateSave = (i: number) => {
    if (tempDate) setReviewDate(session.id, i, tempDate);
    setEditingDateIndex(null);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={session.topicLabel}>
        <div className="flex flex-col gap-4">

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
              {formatDate(session.date, 'EEE, MMM d, yyyy')}
            </span>
            {subject && (
              <span className={`text-xs font-body font-medium ${colors.text}`}>{subject.name}</span>
            )}
            {resolvedTags.map(tag => (
              <span key={tag.id} className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium capitalize
                bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500
                border border-slate-200 dark:border-ink-600/40">
                {tag.name}
              </span>
            ))}
            {session.notesLink && (
              <a
                href={session.notesLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium
                  bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400
                  border border-emerald-200 dark:border-emerald-500/25 hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink size={9} />
                Notes
              </a>
            )}
          </div>

          {/* Attendance + Progress */}
          <div className="flex items-center gap-3">
            <StatusBadge status={session.attendanceStatus} size="sm" onClick={() => {
              const cur = ATTENDANCE_STATUS_ORDER.indexOf(session.attendanceStatus);
              const next = ATTENDANCE_STATUS_ORDER[(cur + 1) % ATTENDANCE_STATUS_ORDER.length];
              cycleAttendance(session.id);
              if (next === 'attended') addToast('Attendance marked!');
              else if (next === 'partially-attended') addToast('Partially attended');
              else addToast('Attendance reset', 'info');
            }} />
            <ProgressBar value={progress} size="xs" color={subject?.color as any ?? 'emerald'} className="flex-1" />
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums">{pctNum(progress)}%</span>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-body font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Reviews
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { addReview(session.id); addToast('Review added'); }}
                  className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400
                    hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-medium"
                >
                  <Plus size={10} />
                  Add
                </button>
                <button
                  onClick={() => regenerateReviews(session.id, settings.reviewIntervals)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-600
                    hover:text-emerald-600 dark:hover:text-slate-400 transition-colors"
                >
                  <RefreshCw size={10} />
                  Regenerate
                </button>
              </div>
            </div>

            {session.reviews.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-600 py-2">No reviews scheduled.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {session.reviews.map((review, i) => {
                  const dateEnabled = review.dateEnabled !== false;
                  const isEditingDate = editingDateIndex === i;

                  return (
                    <div key={review.id} className={`rounded-xl border font-body ${REVIEW_STATUS_COLORS[review.status]}`}>
                      <button
                        onClick={() => {
                          const cur = READ_STATUS_ORDER.indexOf(review.status);
                          const next = READ_STATUS_ORDER[(cur + 1) % READ_STATUS_ORDER.length];
                          cycleReviewStatus(session.id, i);
                          if (next === 'done') addToast(`Review ${review.reviewNumber} completed!`);
                        }}
                        className="flex items-center gap-2 w-full px-3 pt-2.5 pb-1.5 text-left hover:opacity-80 transition-opacity active:scale-[0.98]"
                      >
                        <span className="text-xs font-semibold">Review {review.reviewNumber}</span>
                        <StatusBadge status={review.status} />
                      </button>

                      <div className="flex items-center gap-1 px-2 pb-2">
                        <button
                          onClick={() => toggleReviewDate(session.id, i, session.date, settings.reviewIntervals)}
                          title={dateEnabled ? 'Disable date' : 'Enable date'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center
                            hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                        >
                          {dateEnabled
                            ? <ToggleRight size={18} className="text-emerald-500 dark:text-emerald-400" />
                            : <ToggleLeft size={18} className="text-slate-400 dark:text-slate-500" />
                          }
                        </button>

                        <div className="flex-1 min-w-0">
                          {isEditingDate ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={tempDate}
                                onChange={e => setTempDate(e.target.value)}
                                className="text-xs font-mono bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600/60
                                  rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 w-full"
                              />
                              <button
                                onClick={() => handleDateSave(i)}
                                className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center
                                  text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors shrink-0"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={() => setEditingDateIndex(null)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-ink-700/60 flex items-center justify-center
                                  text-slate-400 hover:bg-slate-200 dark:hover:bg-ink-600/60 transition-colors shrink-0"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => dateEnabled && handleDateEdit(i, review.scheduledDate)}
                              disabled={!dateEnabled}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono w-full text-left
                                transition-colors ${dateEnabled
                                  ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                                  : 'opacity-40 cursor-default'}`}
                            >
                              <Calendar size={12} className="shrink-0" />
                              <span>{dateEnabled
                                ? (review.scheduledDate ? formatDate(review.scheduledDate, 'MMM d, yyyy') : 'Set date')
                                : 'No date'
                              }</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setDeleteReviewId(review.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                            text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400
                            hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          {session.notes && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic pt-3 border-t border-slate-100 dark:border-ink-700/40">
              {session.notes}
            </p>
          )}

          {/* Weekly Test */}
          <div className={session.notes ? '' : 'pt-3 border-t border-slate-100 dark:border-ink-700/40'}>
            <button
              onClick={() => setWeeklyTestOpen(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border
                border-slate-200 dark:border-ink-600/50 bg-slate-50 dark:bg-ink-900/40
                hover:border-emerald-300 dark:hover:border-emerald-500/30
                hover:bg-emerald-50 dark:hover:bg-emerald-500/10
                text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300
                transition-all active:scale-[0.98] group"
            >
              <FlaskConical size={13} className="text-slate-400 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span className="text-xs font-body font-medium">Weekly Test</span>
              {(session.weeklyTest?.scores?.length ?? 0) > 0 && (
                <span className="ml-auto text-[10px] font-mono text-slate-400 dark:text-slate-600">
                  {session.weeklyTest!.scores.length} take{session.weeklyTest!.scores.length !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" fullWidth onClick={() => { onClose(); onEdit(session); }}>
              Edit Session
            </Button>
            <Button variant="danger" fullWidth onClick={() => { onClose(); onDelete(session.id); }}>
              Delete
            </Button>
          </div>

        </div>
      </Modal>

      <WeeklyTestModal
        session={session}
        open={weeklyTestOpen}
        onClose={() => setWeeklyTestOpen(false)}
      />

      <DeleteConfirmModal
        open={deleteReviewId !== null}
        label={(() => {
          const rev = session.reviews.find(r => r.id === deleteReviewId);
          return rev ? `Delete Review ${rev.reviewNumber}? This cannot be undone.` : '';
        })()}
        onConfirm={() => {
          if (deleteReviewId) { deleteReview(session.id, deleteReviewId); addToast('Review deleted', 'info'); }
        }}
        onClose={() => setDeleteReviewId(null)}
      />
    </>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────

interface Props {
  session: Session;
  onEdit:   (s: Session) => void;
  onDelete: (id: string) => void;
}

export const SessionCard: React.FC<Props> = ({ session, onEdit, onDelete }) => {
  const { subjects } = useSubjectsStore();
  const { tags: allTags } = useTagsStore();
  const [detailOpen, setDetailOpen] = useState(false);

  const subject      = (session.subjectEnabled !== false) ? subjects.find(s => s.id === session.subjectId) : undefined;
  const colors       = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
  const progress     = sessionProgress(session);
  const today        = isToday(session.date);
  const past         = isPast(session.date);
  const resolvedTags = (session.tags ?? []).map(id => allTags.find(t => t.id === id)).filter(Boolean) as { id: string; name: string }[];

  return (
    <>
      <div
        className={`bg-white dark:bg-ink-800/60 border ${colors.border} rounded-xl
          transition-all hover:shadow-card-hover dark:hover:border-opacity-70
          animate-fade-in overflow-hidden shadow-card dark:shadow-none cursor-pointer`}
        onClick={() => setDetailOpen(true)}
      >
        <div className={`relative grid grid-cols-[4.75rem_minmax(0,1fr)] min-h-[112px] ${colors.bg}`}>
          <div className="flex flex-col items-center justify-center border-r border-slate-200/70 dark:border-ink-700/50 px-3 text-center">
            <span className="block w-full text-center text-xs font-body font-medium text-slate-500 dark:text-slate-400">
              {formatDate(session.date, 'EEE')}
            </span>
            <span className="mt-1 block w-full text-center text-base font-body font-semibold leading-none text-slate-600 dark:text-slate-300">
              {formatDate(session.date, 'MMM d')}
            </span>
            {(today || past) && (
              <span className={`mt-2 block text-center rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                today
                  ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-ink-700/60 text-slate-400 dark:text-slate-500'
              }`}>
                {today ? 'TODAY' : 'PAST'}
              </span>
            )}
          </div>

          <div className="min-w-0 px-4 py-4 pr-14 sm:pr-16">
            <div className="flex min-w-0 items-center gap-2">
              {subject && <span className={`h-2.5 w-2.5 rounded-full ${colors.dot} shrink-0`} />}
              <span className="truncate text-sm font-body font-semibold text-slate-800 dark:text-slate-200">
                {session.topicLabel}
              </span>
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-2">
              {subject && <p className={`truncate text-xs font-body font-medium uppercase ${colors.text}`}>{subject.name}</p>}
              {session.notesLink && (
                <a
                  href={session.notesLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-200 bg-white/60 px-1.5 py-0.5 text-[9px] font-mono font-medium
                    text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-500/25 dark:bg-ink-700/60 dark:text-emerald-400 dark:hover:bg-emerald-500/15"
                >
                  <ExternalLink size={9} />
                  Notes
                </a>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex shrink-0 items-center gap-1.5">
                <Calendar size={12} className="text-slate-400 dark:text-slate-600" />
                <StatusBadge status={session.attendanceStatus} size="sm" />
              </div>
              <ProgressBar value={progress} size="xs" color={subject?.color as any ?? 'emerald'} className="min-w-0 flex-1" />
              <span className={`w-8 shrink-0 text-right text-xs font-mono font-semibold tabular-nums ${colors.text}`}>
                {pctNum(progress)}%
              </span>
            </div>

            {resolvedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {resolvedTags.map(tag => (
                <span key={tag.id} className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium capitalize
                  bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500
                  border border-slate-200 dark:border-ink-600/40">
                  {tag.name}
                </span>
              ))}
              </div>
            )}
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); onEdit(session); }}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white/70 dark:bg-ink-800/70 dark:border-ink-600/60
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-ink-500 transition-all active:scale-90"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(session.id); }}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white/70 dark:bg-ink-800/70 dark:border-ink-600/60
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all active:scale-90"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <SessionDetailModal
        session={session}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};

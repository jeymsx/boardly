import React, { useState } from 'react';
import {
  Pencil, Trash2, ChevronDown, ChevronUp, CalendarCheck, RefreshCw,
  ExternalLink, ToggleLeft, ToggleRight, Calendar, FlaskConical, Check, X,
} from 'lucide-react';
import { useSessionsStore } from '../store/useSessionsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { sessionProgress, pctNum } from '../utils/progress';
import { averageScore, highestScore } from '../utils/scores';
import { formatDate, isToday, isPast } from '../utils/dates';
import { ProgressBar } from './ui/ProgressBar';
import { StatusBadge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { COLOR_MAP } from '../types';
import type { Session, WeeklyScore } from '../types';

const REVIEW_STATUS_COLORS: Record<string, string> = {
  'pending':     'bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-ink-600/40',
  'in-progress': 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  'done':        'bg-emerald-50 dark:bg-jade-500/20 text-emerald-700 dark:text-jade-400 border-emerald-200 dark:border-jade-500/30',
};

// ─── Weekly Test Modal ────────────────────────────────────────────────────────

interface WeeklyTestModalProps {
  session: Session;
  open: boolean;
  onClose: () => void;
}

// ─── Editable weekly score row ────────────────────────────────────────────────

interface WeeklyScoreRowProps { sc: WeeklyScore; sessionId: string }

const WeeklyScoreRow: React.FC<WeeklyScoreRowProps> = ({ sc, sessionId }) => {
  const { deleteWeeklyScore, updateWeeklyScore } = useSessionsStore();
  const [editing,  setEditing]  = useState(false);
  const [editVal,  setEditVal]  = useState(String(sc.score));
  const [editMax,  setEditMax]  = useState(String(sc.maxScore));
  const [editLink, setEditLink] = useState(sc.link ?? '');

  const pct = (sc.score / sc.maxScore) * 100;

  const handleSave = () => {
    const s = parseFloat(editVal);
    const m = parseFloat(editMax);
    if (!isNaN(s) && !isNaN(m) && m > 0) {
      updateWeeklyScore(sessionId, sc.id, { score: s, maxScore: m, link: editLink || undefined });
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditVal(String(sc.score)); setEditMax(String(sc.maxScore)); setEditLink(sc.link ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg
        bg-slate-50 dark:bg-ink-900/60 border border-emerald-300 dark:border-emerald-500/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-6 shrink-0">#{sc.attemptNumber}</span>
          <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
            autoFocus
            className="w-20 bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600/60
              rounded-lg px-2 py-1 text-xs font-mono text-slate-800 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:ring-emerald-500/40" />
          <span className="text-xs text-slate-400">/</span>
          <input type="number" value={editMax} onChange={e => setEditMax(e.target.value)}
            className="w-20 bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600/60
              rounded-lg px-2 py-1 text-xs font-mono text-slate-800 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:ring-emerald-500/40" />
          <div className="ml-auto flex gap-1">
            <button onClick={handleSave}
              className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-500/20
                flex items-center justify-center text-emerald-600 dark:text-emerald-400
                hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
              <Check size={11} />
            </button>
            <button onClick={handleCancel}
              className="w-6 h-6 rounded-md bg-slate-100 dark:bg-ink-700/60
                flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <X size={11} />
            </button>
          </div>
        </div>
        <input type="url" value={editLink} onChange={e => setEditLink(e.target.value)}
          placeholder="Link (optional)"
          className="w-full bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600/60
            rounded-lg px-2 py-1 text-xs font-body text-slate-800 dark:text-slate-200
            placeholder-slate-400 dark:placeholder-slate-600
            focus:outline-none focus:ring-1 focus:ring-emerald-500/40" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg
      bg-slate-50 dark:bg-ink-900/40 border border-slate-200 dark:border-ink-700/40">
      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 w-6 shrink-0">#{sc.attemptNumber}</span>
      <div className="flex-1">
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
          className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors shrink-0">
          <ExternalLink size={11} />
        </a>
      )}
      <button onClick={() => { setEditVal(String(sc.score)); setEditMax(String(sc.maxScore)); setEditLink(sc.link ?? ''); setEditing(true); }}
        className="w-5 h-5 rounded flex items-center justify-center
          text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
        <Pencil size={10} />
      </button>
      <button onClick={() => deleteWeeklyScore(sessionId, sc.id)}
        className="w-5 h-5 rounded flex items-center justify-center
          text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
        ×
      </button>
    </div>
  );
};

// ─── Weekly Test Modal ────────────────────────────────────────────────────────

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

        {/* Test link — always visible */}
        <input
          type="url"
          value={wtLink}
          onChange={e => setWtLink(e.target.value)}
          onBlur={handleLinkBlur}
          placeholder="Test link (optional)"
          className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
            rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-600
            focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
        />

        {/* Stats row */}
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

        {/* Score history */}
        {scores.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {scores.map(sc => (
              <WeeklyScoreRow key={sc.id} sc={sc} sessionId={session.id} />
            ))}
          </div>
        )}

        {/* Add score — always visible */}
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

// ─── Session Card ─────────────────────────────────────────────────────────────

interface Props {
  session: Session;
  onEdit:   (s: Session) => void;
  onDelete: (id: string) => void;
}

export const SessionCard: React.FC<Props> = ({ session, onEdit, onDelete }) => {
  const { cycleAttendance, cycleReviewStatus, regenerateReviews, toggleReviewDate, setReviewDate } = useSessionsStore();
  const { subjects } = useSubjectsStore();
  const { settings } = useSettingsStore();
  const [expanded,         setExpanded]         = useState(false);
  const [weeklyTestOpen,   setWeeklyTestOpen]   = useState(false);
  const [editingDateIndex, setEditingDateIndex] = useState<number | null>(null);
  const [tempDate,         setTempDate]         = useState('');

  const subject  = subjects.find(s => s.id === session.subjectId);
  const colors   = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
  const progress = sessionProgress(session);
  const today    = isToday(session.date);
  const past     = isPast(session.date);

  const handleDateEdit = (i: number, currentDate: string | null) => {
    setEditingDateIndex(i);
    setTempDate(currentDate ?? '');
  };

  const handleDateSave = (i: number) => {
    if (tempDate) {
      setReviewDate(session.id, i, tempDate);
    }
    setEditingDateIndex(null);
  };

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
              {today && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400
                  bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30
                  rounded-full px-2 py-0.5">TODAY</span>
              )}
              {!today && past && (
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600
                  bg-slate-100 dark:bg-ink-700/60 border border-slate-200 dark:border-ink-600/40
                  rounded-full px-2 py-0.5">PAST</span>
              )}
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                {formatDate(session.date, 'EEE, MMM d')}
              </span>
              {session.notesLink && (
                <a
                  href={session.notesLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline ml-1"
                >
                  <ExternalLink size={10} /> Notes
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              {subject && <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />}
              <span className="font-body font-semibold text-slate-800 dark:text-slate-200 text-sm
                group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                {session.topicLabel}
              </span>
              <span className="text-slate-400 dark:text-slate-600 ml-auto shrink-0">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </div>
            {subject && <p className={`text-xs ${colors.text} mt-0.5 truncate`}>{subject.name}</p>}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(session)}
              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-ink-700/40 hover:bg-slate-200 dark:hover:bg-ink-600
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-90"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDelete(session.id)}
              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-ink-700/40 hover:bg-rose-50 dark:hover:bg-rose-500/20
                flex items-center justify-center text-slate-400 dark:text-slate-500
                hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-90"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2.5">
          <div className="flex items-center gap-1.5">
            <CalendarCheck size={12} className="text-slate-400 dark:text-slate-600" />
            <StatusBadge status={session.attendanceStatus} size="sm" onClick={() => cycleAttendance(session.id)} />
          </div>
          <ProgressBar value={progress} size="xs" color={subject?.color as any ?? 'emerald'} className="flex-1" />
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums">{pctNum(progress)}%</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-ink-700/40">
          {/* Reviews section */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-body font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Reviews
            </p>
            <button
              onClick={() => regenerateReviews(session.id, settings.reviewIntervals)}
              className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-600
                hover:text-emerald-600 dark:hover:text-slate-400 transition-colors"
            >
              <RefreshCw size={10} />
              Regenerate
            </button>
          </div>

          {session.reviews.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-600 py-2">No reviews scheduled.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {session.reviews.map((review, i) => {
                const dateEnabled = review.dateEnabled !== false;
                const isEditingDate = editingDateIndex === i;

                return (
                  <div key={review.id} className={`rounded-lg border text-xs font-body
                    ${REVIEW_STATUS_COLORS[review.status]}`}
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button
                        onClick={() => cycleReviewStatus(session.id, i)}
                        className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity active:scale-[0.98]"
                      >
                        <span className="font-medium">Review {review.reviewNumber}</span>
                        <StatusBadge status={review.status} />
                      </button>

                      {/* Date display / edit */}
                      <div className="flex items-center gap-1 shrink-0">
                        {dateEnabled ? (
                          isEditingDate ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={tempDate}
                                onChange={e => setTempDate(e.target.value)}
                                className="text-[10px] font-mono bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-600/60
                                  rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                              />
                              <button
                                onClick={() => handleDateSave(i)}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingDateIndex(null)}
                                className="text-[10px] text-slate-400 hover:text-slate-600"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDateEdit(i, review.scheduledDate)}
                              className="font-mono text-[10px] opacity-70 hover:opacity-100 transition-opacity"
                            >
                              {review.scheduledDate ? formatDate(review.scheduledDate, 'MMM d') : '—'}
                            </button>
                          )
                        ) : (
                          <span className="font-mono text-[10px] opacity-50 italic">No date</span>
                        )}

                        {/* Date toggle */}
                        <button
                          onClick={() => toggleReviewDate(session.id, i, session.date, settings.reviewIntervals)}
                          title={dateEnabled ? 'Disable date' : 'Enable date'}
                          className="ml-1 text-slate-400 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {dateEnabled
                            ? <ToggleRight size={14} className="text-emerald-500 dark:text-emerald-400" />
                            : <ToggleLeft size={14} />
                          }
                        </button>

                        {/* Calendar icon shortcut */}
                        {dateEnabled && !isEditingDate && (
                          <button
                            onClick={() => handleDateEdit(i, review.scheduledDate)}
                            className="text-slate-400 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <Calendar size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {session.notes && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5 pt-2.5
              border-t border-slate-100 dark:border-ink-700/40 italic">
              {session.notes}
            </p>
          )}

          {/* Weekly Test button */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-ink-700/40">
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
        </div>
      )}

      <WeeklyTestModal
        session={session}
        open={weeklyTestOpen}
        onClose={() => setWeeklyTestOpen(false)}
      />
    </div>
  );
};

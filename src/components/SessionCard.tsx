import React, { useState } from 'react';
import {
  Pencil, Trash2, RefreshCw,
  ExternalLink, ToggleLeft, ToggleRight, Calendar, Plus, Check, X,
} from 'lucide-react';
import { useSessionsStore } from '../store/useSessionsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTagsStore } from '../store/useTagsStore';
import { useToastStore } from '../store/useToastStore';
import { ATTENDANCE_STATUS_ORDER, READ_STATUS_ORDER } from '../types';
import { sessionProgress, pctNum } from '../utils/progress';
import { formatDate, isToday, isPast } from '../utils/dates';
import { ProgressBar } from './ui/ProgressBar';
import { StatusBadge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { COLOR_MAP } from '../types';
import type { Session } from '../types';

const REVIEW_STATUS_COLORS: Record<string, string> = {
  'pending':     'bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-ink-600/40',
  'in-progress': 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  'done':        'bg-emerald-50 dark:bg-jade-500/20 text-emerald-700 dark:text-jade-400 border-emerald-200 dark:border-jade-500/30',
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteConfirmProps {
  open: boolean;
  label: string;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmProps> = ({ open, label, onConfirm, onClose }) => (
  <Modal open={open} onClose={onClose} title="Delete Review">
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

// ─── Session Detail Modal ─────────────────────────────────────────────────────

interface SessionDetailModalProps {
  session: Session;
  open: boolean;
  onClose: () => void;
  onEdit: (s: Session) => void;
  onDelete: (id: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session, open, onClose, onEdit, onDelete,
}) => {
  const {
    cycleAttendance, cycleReviewStatus, regenerateReviews,
    toggleReviewDate, setReviewDate, addReview, deleteReview,
  } = useSessionsStore();
  const { subjects } = useSubjectsStore();
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
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

  const headerActions = (
    <>
      <button
        onClick={() => { onClose(); onEdit(session); }}
        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-ink-700/60 hover:bg-slate-200 dark:hover:bg-ink-600
          flex items-center justify-center text-slate-500 dark:text-slate-400
          hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95"
        title="Edit session"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={() => { onClose(); onDelete(session.id); }}
        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-ink-700/60 hover:bg-rose-100 dark:hover:bg-rose-500/20
          flex items-center justify-center text-slate-500 dark:text-slate-400
          hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95"
        title="Delete session"
      >
        <Trash2 size={14} />
      </button>
    </>
  );

  return (
    <>
      <Modal open={open} onClose={onClose} title={session.topicLabel} headerActions={headerActions}>
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

          {/* Done */}
          <div className="pt-1">
            <Button variant="ghost" fullWidth onClick={onClose}>Done</Button>
          </div>

        </div>
      </Modal>

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

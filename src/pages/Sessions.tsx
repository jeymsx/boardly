import React, { useState, useMemo } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import { useSessionsStore } from '../store/useSessionsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { SessionCard } from '../components/SessionCard';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import { todayISO } from '../utils/dates';
import type { Session } from '../types';

// ─── Session Form Modal ───────────────────────────────────────────────────────

interface SessionForm {
  date: string;
  subjectId: string;
  topicLabel: string;
  totalReviews: number;
  notes: string;
  notesLink: string;
}

interface SessionModalProps {
  open: boolean;
  initial?: Session | null;
  defaultReviews: number;
  subjects: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (form: SessionForm) => void;
}

const SessionModal: React.FC<SessionModalProps> = ({
  open, initial, defaultReviews, subjects, onClose, onSave,
}) => {
  const [date,         setDate]         = useState(initial?.date         ?? todayISO());
  const [subjectId,    setSubjectId]    = useState(initial?.subjectId    ?? (subjects[0]?.id ?? ''));
  const [topicLabel,   setTopicLabel]   = useState(initial?.topicLabel   ?? '');
  const [totalReviews, setTotalReviews] = useState(initial?.totalReviews ?? defaultReviews);
  const [notes,        setNotes]        = useState(initial?.notes        ?? '');
  const [notesLink,    setNotesLink]    = useState(initial?.notesLink    ?? '');

  React.useEffect(() => {
    if (open) {
      setDate(initial?.date ?? todayISO());
      setSubjectId(initial?.subjectId ?? (subjects[0]?.id ?? ''));
      setTopicLabel(initial?.topicLabel ?? '');
      setTotalReviews(initial?.totalReviews ?? defaultReviews);
      setNotes(initial?.notes ?? '');
      setNotesLink(initial?.notesLink ?? '');
    }
  }, [open, initial, defaultReviews, subjects]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Session' : 'New Session'}>
      <div className="flex flex-col gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <Select
          label="Subject"
          value={subjectId}
          onChange={e => setSubjectId(e.target.value)}
        >
          {subjects.length === 0
            ? <option value="">No subjects — add one first</option>
            : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
          }
        </Select>
        <Input
          label="Topic / Day Label"
          value={topicLabel}
          onChange={e => setTopicLabel(e.target.value)}
          placeholder="e.g. Day 1 — Water Supply Systems"
          autoFocus
        />
        <Input
          label="Number of Reviews"
          type="number"
          min={0}
          max={10}
          value={totalReviews}
          onChange={e => setTotalReviews(Math.max(0, parseInt(e.target.value) || 0))}
          hint="Reviews will be auto-scheduled based on your interval settings"
        />
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any notes..."
          rows={2}
        />
        <Input
          label="Notes Link (optional)"
          type="url"
          value={notesLink}
          onChange={e => setNotesLink(e.target.value)}
          placeholder="https://..."
        />
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth
            onClick={() => onSave({ date, subjectId, topicLabel: topicLabel.trim(), totalReviews, notes, notesLink })}
            disabled={!topicLabel.trim() || !subjectId}
          >
            {initial ? 'Save' : 'Add Session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal: React.FC<{ open: boolean; label: string; onClose: () => void; onConfirm: () => void }> = (
  { open, label, onClose, onConfirm }
) => (
  <Modal open={open} onClose={onClose} title="Confirm Delete">
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
      Delete session <span className="text-slate-800 dark:text-slate-200 font-medium">"{label}"</span>? This cannot be undone.
    </p>
    <div className="flex gap-2">
      <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
      <Button variant="danger" fullWidth onClick={onConfirm}>Delete</Button>
    </div>
  </Modal>
);

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

type Filter = 'all' | 'upcoming' | 'past';

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Sessions: React.FC = () => {
  const { sessions, addSession, updateSession, deleteSession } = useSessionsStore();
  const { subjects } = useSubjectsStore();
  const { settings } = useSettingsStore();

  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState<Session | null>(null);
  const [delModal,  setDelModal]  = useState(false);
  const [delTarget, setDelTarget] = useState<Session | null>(null);
  const [filter,    setFilter]    = useState<Filter>('all');

  const today = todayISO();
  const filtered = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
    if (filter === 'upcoming') return sorted.filter(s => s.date >= today);
    if (filter === 'past')     return sorted.filter(s => s.date < today);
    return sorted;
  }, [sessions, filter, today]);

  const handleSave = (form: SessionForm) => {
    if (editing) {
      updateSession(editing.id, {
        date: form.date,
        subjectId: form.subjectId,
        topicLabel: form.topicLabel,
        totalReviews: form.totalReviews,
        notes: form.notes,
        notesLink: form.notesLink || undefined,
      });
    } else {
      addSession({
        date: form.date,
        subjectId: form.subjectId,
        topicLabel: form.topicLabel,
        totalReviews: form.totalReviews,
        reviewIntervals: settings.reviewIntervals,
        autoGenerate: settings.autoGenerateReviews,
        notesLink: form.notesLink || undefined,
      });
    }
    setModal(false);
    setEditing(null);
  };

  const openEdit = (s: Session) => { setEditing(s); setModal(true); };

  const requestDelete = (s: Session) => { setDelTarget(s); setDelModal(true); };

  const confirmDelete = () => {
    if (delTarget) deleteSession(delTarget.id);
    setDelModal(false);
    setDelTarget(null);
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Lecture Sessions"
        subtitle={`${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setEditing(null); setModal(true); }}>
            Add Session
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50 p-1 rounded-xl mb-4 w-fit">
        {(['all', 'upcoming', 'past'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium capitalize transition-all
              ${filter === f
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 dark:border-emerald-500/30'
                : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={24} />}
          title={filter === 'all' ? 'No sessions yet' : `No ${filter} sessions`}
          description={filter === 'all' ? 'Add your first lecture session to start tracking attendance and reviews.' : undefined}
          action={
            filter === 'all' ? (
              <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModal(true)}>
                Add Session
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={openEdit}
              onDelete={() => requestDelete(session)}
            />
          ))}
        </div>
      )}

      <SessionModal
        open={modal}
        initial={editing}
        defaultReviews={settings.defaultReviewsPerSession}
        subjects={subjects}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={handleSave}
      />
      <DeleteModal
        open={delModal}
        label={delTarget?.topicLabel ?? ''}
        onClose={() => setDelModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

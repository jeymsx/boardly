import React, { useState, useMemo, useRef } from 'react';
import { Plus, GraduationCap, Search, SlidersHorizontal, X, Tag, Pencil, Trash2, LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import { useSessionsStore } from '../store/useSessionsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTagsStore } from '../store/useTagsStore';
import { useToastStore } from '../store/useToastStore';
import { SessionCard, SessionDetailModal } from '../components/SessionCard';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PageHeader } from '../components/layout/PageHeader';
import { sessionProgress, pctNum } from '../utils/progress';
import { COLOR_MAP } from '../types';
import type { Session } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function displayToISO(display: string): string {
  const parts = display.split('/');
  if (parts.length !== 3) return '';
  const [m, d, y] = parts;
  if (!m || !d || !y || y.length !== 4) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// ─── Tag Chip ─────────────────────────────────────────────────────────────────

const TAG_ACTIVE = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 dark:border-emerald-500/40';
const TAG_IDLE   = 'bg-slate-100 dark:bg-ink-800/60 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-ink-600/40 hover:border-slate-300 dark:hover:border-ink-500/60';

// ─── Session Form Modal ───────────────────────────────────────────────────────

interface SessionForm {
  date: string;
  subjectId: string;
  subjectEnabled: boolean;
  topicLabel: string;
  totalReviews: number;
  notes: string;
  notesLink: string;
  tags: string[];
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
  const { addToast } = useToastStore();
  const { tags: allTags, addTag } = useTagsStore();

  const [dateDisplay,    setDateDisplay]    = useState('');
  const [subjectEnabled, setSubjectEnabled] = useState(initial?.subjectEnabled ?? true);
  const [subjectId,      setSubjectId]      = useState(initial?.subjectId ?? (subjects[0]?.id ?? ''));
  const [topicLabel,     setTopicLabel]     = useState(initial?.topicLabel ?? '');
  const [totalReviews,   setTotalReviews]   = useState(initial?.totalReviews ?? defaultReviews);
  const [notes,          setNotes]          = useState(initial?.notes ?? '');
  const [notesLink,      setNotesLink]      = useState(initial?.notesLink ?? '');
  const [selectedTags,   setSelectedTags]   = useState<string[]>(initial?.tags ?? []);
  const [newTagInput,    setNewTagInput]    = useState('');
  const newTagRef = useRef<HTMLInputElement>(null);
  const prevOpen  = useRef(false);

  React.useEffect(() => {
    if (open && !prevOpen.current) {
      setDateDisplay(initial?.date ? isoToDisplay(initial.date) : '');
      setSubjectEnabled(initial?.subjectEnabled ?? true);
      setSubjectId(initial?.subjectId ?? (subjects[0]?.id ?? ''));
      setTopicLabel(initial?.topicLabel ?? '');
      setTotalReviews(initial?.totalReviews ?? defaultReviews);
      setNotes(initial?.notes ?? '');
      setNotesLink(initial?.notesLink ?? '');
      setSelectedTags(initial?.tags ?? []);
      setNewTagInput('');
    }
    prevOpen.current = open;
  }, [open, initial, defaultReviews, subjects]);

  const toggleTag = (id: string) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleCreateTag = () => {
    const name = newTagInput.trim();
    if (!name) return;
    const tag = addTag(name);
    if (!tag) {
      const existing = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existing && !selectedTags.includes(existing.id)) {
        setSelectedTags(prev => [...prev, existing.id]);
        addToast('Tag already exists — selected it instead', 'info');
      }
    } else {
      setSelectedTags(prev => [...prev, tag.id]);
    }
    setNewTagInput('');
    newTagRef.current?.focus();
  };

  const handleSave = () => {
    const isoDate = displayToISO(dateDisplay);
    if (!isoDate) {
      addToast('Please enter a valid date (MM/DD/YYYY)', 'error');
      return;
    }
    if (!topicLabel.trim()) {
      addToast('Topic label is required', 'error');
      return;
    }
    if (subjectEnabled && !subjectId) {
      addToast('Please select a subject', 'error');
      return;
    }
    onSave({
      date: isoDate, subjectId, subjectEnabled,
      topicLabel: topicLabel.trim(), totalReviews,
      notes, notesLink, tags: selectedTags,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Session' : 'New Session'}>
      <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>

        {/* Subject toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-body font-medium text-slate-600 dark:text-slate-400">Subject</label>
            <button
              type="button"
              onClick={() => setSubjectEnabled(v => !v)}
              className={`relative w-9 rounded-full transition-all flex-shrink-0 h-5
                ${subjectEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-ink-600 border border-slate-300 dark:border-ink-500'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all
                ${subjectEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
          {subjectEnabled && (
            <Select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              {subjects.length === 0
                ? <option value="">No subjects — add one first</option>
                : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              }
            </Select>
          )}
        </div>

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

        <div>
          <label className="text-xs font-body font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
            Date <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={dateDisplay}
            onChange={e => setDateDisplay(e.target.value)}
            placeholder="MM/DD/YYYY"
            className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
              rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-600
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs font-body font-medium text-slate-600 dark:text-slate-400 mb-2">Tags</p>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border transition-all
                    ${selectedTags.includes(tag.id) ? TAG_ACTIVE : TAG_IDLE}`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          {/* Inline create */}
          <div className="flex items-center gap-2">
            <input
              ref={newTagRef}
              type="text"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleCreateTag(); }
              }}
              placeholder={allTags.length === 0 ? 'Create your first tag…' : 'New tag…'}
              className="flex-1 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                rounded-xl px-3 py-2 text-xs font-body text-slate-900 dark:text-slate-100
                placeholder-slate-400 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagInput.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-body font-medium
                bg-emerald-500/15 text-emerald-700 dark:text-emerald-300
                border border-emerald-400/30 dark:border-emerald-500/30
                hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={11} />
              Add
            </button>
          </div>
        </div>

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
          <Button variant="primary" fullWidth onClick={handleSave}
            disabled={!topicLabel.trim() || (subjectEnabled && !subjectId)}
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

// ─── Tag Manager Modal ────────────────────────────────────────────────────────

const TagManagerModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { tags, addTag, updateTag, deleteTag } = useTagsStore();
  const { removeTagFromSessions } = useSessionsStore();
  const { addToast } = useToastStore();
  const [newName,    setNewName]    = useState('');
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState('');

  React.useEffect(() => {
    if (open) { setNewName(''); setEditingId(null); setEditingVal(''); }
  }, [open]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const tag = addTag(name);
    if (!tag) { addToast('A tag with that name already exists', 'error'); return; }
    setNewName('');
    addToast(`Tag "${tag.name}" created`);
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingVal(name);
  };

  const commitEdit = () => {
    if (!editingId || !editingVal.trim()) { setEditingId(null); return; }
    updateTag(editingId, editingVal.trim());
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    deleteTag(id);
    removeTagFromSessions(id);
    addToast(`Tag "${name}" deleted`, 'info');
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Tags">
      <div className="flex flex-col gap-4">

        {/* Create new tag */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
            placeholder="New tag name…"
            autoFocus
            className="flex-1 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
              rounded-xl px-3.5 py-2.5 text-sm font-body text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-600
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-body font-medium
              bg-emerald-500 text-white hover:bg-emerald-600
              disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            <Plus size={13} />
            Create
          </button>
        </div>

        {/* Tag list */}
        {tags.length === 0 ? (
          <div className="py-6 text-center">
            <Tag size={20} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400 dark:text-slate-600 font-body">No tags yet.</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 font-body mt-0.5">Create one above to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center gap-2 px-3 py-2 rounded-xl
                bg-slate-50 dark:bg-ink-900/40 border border-slate-200 dark:border-ink-700/40">
                {editingId === tag.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingVal}
                    onChange={e => setEditingVal(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                      if (e.key === 'Escape') { setEditingId(null); }
                    }}
                    className="flex-1 bg-white dark:bg-ink-800 border border-emerald-400/50 dark:border-emerald-500/40
                      rounded-lg px-2.5 py-1 text-sm font-body text-slate-900 dark:text-slate-100
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                ) : (
                  <span className="flex-1 text-sm font-body text-slate-700 dark:text-slate-300 truncate">
                    {tag.name}
                  </span>
                )}
                <button
                  onClick={() => editingId === tag.id ? commitEdit() : startEdit(tag.id, tag.name)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                    text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300
                    hover:bg-slate-200 dark:hover:bg-ink-700/60 transition-all"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(tag.id, tag.name)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                    text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400
                    hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Filter Modal ─────────────────────────────────────────────────────────────

interface ActiveFilters {
  subjectIds: string[];
  tagIds: string[];
}

interface FilterModalProps {
  open: boolean;
  filters: ActiveFilters;
  subjects: Array<{ id: string; name: string }>;
  onChange: (f: ActiveFilters) => void;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ open, filters, subjects, onChange, onClose }) => {
  const { tags: allTags } = useTagsStore();
  const [local, setLocal] = useState<ActiveFilters>(filters);

  React.useEffect(() => {
    if (open) setLocal(filters);
  }, [open, filters]);

  const toggleSubject = (id: string) => {
    setLocal(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(id)
        ? prev.subjectIds.filter(s => s !== id)
        : [...prev.subjectIds, id],
    }));
  };

  const toggleTag = (id: string) => {
    setLocal(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter(t => t !== id)
        : [...prev.tagIds, id],
    }));
  };

  const handleApply = () => { onChange(local); onClose(); };
  const handleClear = () => {
    const empty: ActiveFilters = { subjectIds: [], tagIds: [] };
    setLocal(empty);
    onChange(empty);
    onClose();
  };

  const activeCount = local.subjectIds.length + local.tagIds.length;

  return (
    <Modal open={open} onClose={onClose} title="Filter Sessions">
      <div className="flex flex-col gap-5">
        {subjects.length > 0 && (
          <div>
            <p className="text-xs font-body font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Subject
            </p>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border transition-all
                    ${local.subjectIds.includes(s.id) ? TAG_ACTIVE : TAG_IDLE}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {allTags.length > 0 && (
          <div>
            <p className="text-xs font-body font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border transition-all
                    ${local.tagIds.includes(tag.id) ? TAG_ACTIVE : TAG_IDLE}`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {subjects.length === 0 && allTags.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-600 font-body text-center py-4">
            No subjects or tags to filter by yet.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {activeCount > 0 && (
            <Button variant="ghost" fullWidth onClick={handleClear}>Clear</Button>
          )}
          <Button variant="primary" fullWidth onClick={handleApply}>
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Status Filter ────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'upcoming' | 'past';

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Sessions: React.FC = () => {
  const { sessions, addSession, updateSession, deleteSession, cycleAttendance } = useSessionsStore();
  const { subjects } = useSubjectsStore();
  const { settings } = useSettingsStore();
  const { tags: allTags } = useTagsStore();
  const { addToast } = useToastStore();

  const [modal,       setModal]       = useState(false);
  const [editing,     setEditing]     = useState<Session | null>(null);
  const [delModal,    setDelModal]    = useState(false);
  const [delTarget,   setDelTarget]   = useState<Session | null>(null);
  const [tagMgr,      setTagMgr]      = useState(false);
  const [status,      setStatus]      = useState<StatusFilter>('all');
  const [search,      setSearch]      = useState('');
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [filters,     setFilters]     = useState<ActiveFilters>({ subjectIds: [], tagIds: [] });
  const [sortDir,     setSortDir]     = useState<'desc' | 'asc'>('desc');
  const [view,        setView]        = useState<'card' | 'list'>('card');
  const [viewingSession, setViewingSession] = useState<Session | null>(null);

  // Always derive the live session from the store so modal reflects store mutations
  const liveViewingSession = useMemo(
    () => viewingSession ? (sessions.find(s => s.id === viewingSession.id) ?? null) : null,
    [viewingSession, sessions],
  );

  const today = new Date().toISOString().slice(0, 10);
  const activeFilterCount = filters.subjectIds.length + filters.tagIds.length;

  const filtered = useMemo(() => {
    const sorted = [...sessions].sort((a, b) =>
      sortDir === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    );
    let result = sorted;

    if (status === 'upcoming') result = result.filter(s => s.date >= today);
    if (status === 'past')     result = result.filter(s => s.date < today);

    if (filters.subjectIds.length > 0) {
      result = result.filter(s => filters.subjectIds.includes(s.subjectId));
    }

    if (filters.tagIds.length > 0) {
      result = result.filter(s =>
        (s.tags ?? []).some(tagId => filters.tagIds.includes(tagId))
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(s => {
        const subj = subjects.find(sub => sub.id === s.subjectId);
        const tagNames = (s.tags ?? [])
          .map(id => allTags.find(t => t.id === id)?.name)
          .filter((n): n is string => !!n);
        return (
          s.topicLabel.toLowerCase().includes(q) ||
          (subj?.name.toLowerCase().includes(q) ?? false) ||
          tagNames.some(n => n.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [sessions, status, today, search, subjects, filters, allTags, sortDir]);

  const handleSave = (form: SessionForm) => {
    if (editing) {
      updateSession(editing.id, {
        date: form.date,
        subjectId: form.subjectId,
        subjectEnabled: form.subjectEnabled,
        topicLabel: form.topicLabel,
        totalReviews: form.totalReviews,
        notes: form.notes,
        notesLink: form.notesLink || undefined,
        tags: form.tags,
      });
      addToast('Session updated');
    } else {
      addSession({
        date: form.date,
        subjectId: form.subjectId,
        subjectEnabled: form.subjectEnabled,
        topicLabel: form.topicLabel,
        totalReviews: form.totalReviews,
        reviewIntervals: settings.reviewIntervals,
        autoGenerate: settings.autoGenerateReviews,
        notes: form.notes || undefined,
        notesLink: form.notesLink || undefined,
        tags: form.tags,
      });
      addToast('Session added');
    }
    setModal(false);
    setEditing(null);
  };

  const openEdit = (s: Session) => { setEditing(s); setModal(true); };

  const requestDelete = (s: Session) => { setDelTarget(s); setDelModal(true); };

  const confirmDelete = () => {
    if (delTarget) { deleteSession(delTarget.id); addToast('Session deleted', 'info'); }
    setDelModal(false);
    setDelTarget(null);
  };

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <PageHeader
        title="Lecture Sessions"
        subtitle={`${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setEditing(null); setModal(true); }}>
            Add Session
          </Button>
        }
      />

      {/* Toolbar — row 1: tabs + view toggle */}
      <div className={`flex items-center justify-between gap-2 ${sessions.length > 0 ? 'mb-2' : 'mb-4'}`}>
        <div className="flex gap-1 bg-slate-100 dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50 p-1 rounded-xl shrink-0">
          {(['all', 'upcoming', 'past'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium capitalize transition-all
                ${status === f
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 dark:border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setView('card')}
            title="Card view"
            className={`p-1.5 rounded-lg transition-all
              ${view === 'card'
                ? 'bg-white dark:bg-ink-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView('list')}
            title="List view"
            className={`p-1.5 rounded-lg transition-all
              ${view === 'list'
                ? 'bg-white dark:bg-ink-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Toolbar — row 2: search + filters + tags */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions…"
              className="w-full pl-8 pr-4 py-2 rounded-xl text-sm font-body
                bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
                text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
          </div>

          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            title={sortDir === 'desc' ? 'Newest first — click for oldest first' : 'Oldest first — click for newest first'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-body font-medium border transition-all shrink-0
              bg-white dark:bg-ink-800/60 text-slate-500 dark:text-slate-400
              border-slate-200 dark:border-ink-700/50 hover:border-slate-300 dark:hover:border-ink-600/60"
          >
            <ArrowUpDown size={13} />
            <span className="hidden sm:inline">{sortDir === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>

          <button
            onClick={() => setFilterOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-body font-medium border transition-all shrink-0
              ${activeFilterCount > 0
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30 dark:border-emerald-500/30'
                : 'bg-white dark:bg-ink-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-ink-700/50 hover:border-slate-300 dark:hover:border-ink-600/60'}`}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-mono font-bold
                bg-emerald-500 text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTagMgr(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-body font-medium border transition-all shrink-0
              bg-white dark:bg-ink-800/60 text-slate-500 dark:text-slate-400
              border-slate-200 dark:border-ink-700/50 hover:border-slate-300 dark:hover:border-ink-600/60"
          >
            <Tag size={13} />
            <span className="hidden sm:inline">Tags</span>
            {allTags.length > 0 && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 hidden sm:inline">
                {allTags.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {filters.subjectIds.map(id => {
            const s = subjects.find(s => s.id === id);
            return s ? (
              <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body
                bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300
                border border-emerald-200 dark:border-emerald-500/25">
                {s.name}
                <button onClick={() => setFilters(f => ({ ...f, subjectIds: f.subjectIds.filter(x => x !== id) }))}>
                  <X size={10} />
                </button>
              </span>
            ) : null;
          })}
          {filters.tagIds.map(id => {
            const tag = allTags.find(t => t.id === id);
            return tag ? (
              <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body capitalize
                bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300
                border border-sky-200 dark:border-sky-500/25">
                {tag.name}
                <button onClick={() => setFilters(f => ({ ...f, tagIds: f.tagIds.filter(t => t !== id) }))}>
                  <X size={10} />
                </button>
              </span>
            ) : null;
          })}
          <button
            onClick={() => setFilters({ subjectIds: [], tagIds: [] })}
            className="px-2 py-0.5 rounded-full text-xs font-body text-slate-400 dark:text-slate-500
              hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={24} />}
          title="No sessions yet"
          description="Add your first lecture session to start tracking attendance and reviews."
          action={
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModal(true)}>
              Add Session
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="No results"
          description={search ? `No sessions matching "${search}".` : `No ${status} sessions matching your filters.`}
        />
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={openEdit}
              onDelete={() => requestDelete(session)}
            />
          ))}
        </div>
      ) : (
        /* ── List view ── */
        <div className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50 rounded-2xl overflow-hidden">
          {/* Column headers — hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-[5.5rem_1fr_10rem_6.5rem_10rem_4.5rem] items-center gap-3 px-5 py-2.5
            border-b border-slate-100 dark:border-ink-700/40 bg-slate-50/80 dark:bg-ink-900/40">
            {['Date', 'Title', 'Subject', 'Status', 'Progress', 'Actions'].map(h => (
              <span key={h} className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider last:text-right">
                {h}
              </span>
            ))}
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-ink-700/40">
            {filtered.map(session => {
              const subject = subjects.find(s => s.id === session.subjectId);
              const colors = (session.subjectEnabled !== false && subject) ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
              const prog = sessionProgress(session);
              const progPct = pctNum(prog);
              const date = new Date(session.date + 'T00:00:00');
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div key={session.id}
                  onClick={() => setViewingSession(session)}
                  className="relative flex md:grid md:grid-cols-[5.5rem_1fr_10rem_6.5rem_10rem_4.5rem] items-center gap-3 px-5 py-3
                    hover:bg-slate-50 dark:hover:bg-ink-900/30 transition-colors cursor-pointer">
                  {/* Subject color accent bar */}
                  <span className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${colors.dot}`} />
                  {/* Date */}
                  <div className="shrink-0 pl-1">
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600">{dayName}</p>
                    <p className="text-xs font-body font-semibold text-slate-700 dark:text-slate-300">{monthDay}</p>
                  </div>
                  {/* Title */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                    <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">
                      {session.topicLabel}
                    </p>
                  </div>
                  {/* Subject */}
                  <p className={`hidden md:block text-xs font-body font-semibold uppercase tracking-wide truncate
                    ${session.subjectEnabled !== false && subject ? colors.text : 'text-slate-400 dark:text-slate-600'}`}>
                    {session.subjectEnabled !== false && subject ? subject.name : '—'}
                  </p>
                  {/* Status — clickable to cycle */}
                  <div className="hidden md:block">
                    <button
                      onClick={e => { e.stopPropagation(); cycleAttendance(session.id); }}
                      className="hover:opacity-75 transition-opacity active:scale-95"
                    >
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap cursor-pointer
                        ${session.attendanceStatus === 'attended'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                          : session.attendanceStatus === 'partially-attended'
                          ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30'
                          : 'bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-ink-600/40'}`}
                      >
                        {session.attendanceStatus === 'attended' ? 'Attended' : session.attendanceStatus === 'partially-attended' ? 'Partial' : 'Pending'}
                      </span>
                    </button>
                  </div>
                  {/* Progress */}
                  <div className="hidden md:flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={prog} size="xs" color={prog >= 0.8 ? 'jade' : prog > 0 ? 'orange' : 'rose'} />
                    </div>
                    <span className={`text-xs font-mono font-semibold shrink-0 w-7 text-right
                      ${prog > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {progPct}%
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-auto md:ml-0 shrink-0 justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(session); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center
                        text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300
                        hover:bg-slate-100 dark:hover:bg-ink-700/60 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); requestDelete(session); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center
                        text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400
                        hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
      <FilterModal
        open={filterOpen}
        filters={filters}
        subjects={subjects}
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
      />
      <TagManagerModal
        open={tagMgr}
        onClose={() => setTagMgr(false)}
      />
      {viewingSession && liveViewingSession && (
        <SessionDetailModal
          session={liveViewingSession}
          open={!!viewingSession}
          onClose={() => setViewingSession(null)}
          onEdit={s => { setViewingSession(null); openEdit(s); }}
          onDelete={id => { setViewingSession(null); requestDelete(sessions.find(s => s.id === id)!); }}
        />
      )}
    </div>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import { Plus, FlaskConical, Search, SlidersHorizontal, X, Tag, Pencil, Trash2 } from 'lucide-react';
import { useTestsStore } from '../store/useTestsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTestTagsStore } from '../store/useTestTagsStore';
import { useToastStore } from '../store/useToastStore';
import { TestCard } from '../components/TestCard';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import type { MasteryTest } from '../types';

const TAG_ACTIVE = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 dark:border-emerald-500/40';
const TAG_IDLE   = 'bg-slate-100 dark:bg-ink-800/60 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-ink-600/40 hover:border-slate-300 dark:hover:border-ink-500/60';

// ─── Test Form Modal ──────────────────────────────────────────────────────────

interface TestForm {
  name: string;
  subjectId: string;
  subjectEnabled: boolean;
  topicLabel: string;
  targetScore: number;
  link: string;
  tags: string[];
}

interface TestModalProps {
  open: boolean;
  initial?: MasteryTest | null;
  defaultTarget: number;
  subjects: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave:  (form: TestForm) => void;
}

const TestModal: React.FC<TestModalProps> = ({
  open, initial, defaultTarget, subjects, onClose, onSave,
}) => {
  const { tags: allTags, addTag } = useTestTagsStore();
  const { addToast } = useToastStore();
  const [name,           setName]           = useState(initial?.name           ?? '');
  const [subjectId,      setSubjectId]      = useState(initial?.subjectId      ?? (subjects[0]?.id ?? ''));
  const [subjectEnabled, setSubjectEnabled] = useState(initial?.subjectEnabled ?? true);
  const [topicLabel,     setTopicLabel]     = useState(initial?.topicLabel     ?? '');
  const [targetScore,    setTargetScore]    = useState(initial?.targetScore    ?? defaultTarget);
  const [link,           setLink]           = useState(initial?.link           ?? '');
  const [selectedTags,   setSelectedTags]   = useState<string[]>(initial?.tags ?? []);
  const [newTagInput,    setNewTagInput]    = useState('');
  const newTagRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setSubjectId(initial?.subjectId ?? (subjects[0]?.id ?? ''));
      setSubjectEnabled(initial?.subjectEnabled ?? true);
      setTopicLabel(initial?.topicLabel ?? '');
      setTargetScore(initial?.targetScore ?? defaultTarget);
      setLink(initial?.link ?? '');
      setSelectedTags(initial?.tags ?? []);
      setNewTagInput('');
    }
  }, [open, initial, defaultTarget, subjects]);

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
      }
      addToast('Tag already exists — selected it instead', 'info');
    } else {
      setSelectedTags(prev => [...prev, tag.id]);
    }
    setNewTagInput('');
    newTagRef.current?.focus();
  };

  const handleSave = () => {
    if (!name.trim() || (subjectEnabled && !subjectId)) return;
    onSave({ name: name.trim(), subjectId, subjectEnabled, topicLabel, targetScore, link, tags: selectedTags });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Test' : 'New Test'}>
      <div className="flex flex-col gap-4"
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}>
        <Input
          label="Test Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Plumbing Code Mock Exam 1"
          autoFocus
        />

        {/* Subject toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-body font-medium text-slate-600 dark:text-slate-400">Subject</label>
            <button
              onClick={() => setSubjectEnabled(v => !v)}
              className={`relative w-9 rounded-full transition-all flex-shrink-0 h-5
                ${subjectEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-ink-600 border border-slate-300 dark:border-ink-500'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all
                ${subjectEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
          {subjectEnabled && (
            <Select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
            >
              {subjects.length === 0
                ? <option value="">No subjects</option>
                : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              }
            </Select>
          )}
        </div>

        <Input
          label="Topic (optional)"
          value={topicLabel}
          onChange={e => setTopicLabel(e.target.value)}
          placeholder="e.g. Water Distribution"
        />
        <Input
          label="Target Score (%)"
          type="number"
          min={1}
          max={100}
          value={targetScore}
          onChange={e => setTargetScore(Math.min(100, Math.max(1, parseInt(e.target.value) || 90)))}
          hint="Minimum score to consider this test passed"
        />
        <Input
          label="Test Link (optional)"
          type="url"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://..."
        />

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

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleSave}
            disabled={!name.trim() || (subjectEnabled && !subjectId)}
          >
            {initial ? 'Save' : 'Add Test'}
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
      Delete test <span className="text-slate-800 dark:text-slate-200 font-medium">"{label}"</span>? All scores will be lost.
    </p>
    <div className="flex gap-2">
      <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
      <Button variant="danger" fullWidth onClick={onConfirm}>Delete</Button>
    </div>
  </Modal>
);

// ─── Tag Manager Modal ────────────────────────────────────────────────────────

const TagManagerModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { tags, addTag, updateTag, deleteTag } = useTestTagsStore();
  const { removeTagFromTests } = useTestsStore();
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

  const startEdit = (id: string, name: string) => { setEditingId(id); setEditingVal(name); };

  const commitEdit = () => {
    if (!editingId || !editingVal.trim()) { setEditingId(null); return; }
    updateTag(editingId, editingVal.trim());
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    deleteTag(id);
    removeTagFromTests(id);
    addToast(`Tag "${name}" deleted`, 'info');
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Test Tags">
      <div className="flex flex-col gap-4">
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
  const { tags: allTags } = useTestTagsStore();
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
    <Modal open={open} onClose={onClose} title="Filter Tests">
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Tests: React.FC = () => {
  const { tests, addTest, updateTest, deleteTest } = useTestsStore();
  const { subjects } = useSubjectsStore();
  const { settings } = useSettingsStore();
  const { tags: allTags } = useTestTagsStore();
  const { addToast } = useToastStore();

  const [testModal,    setTestModal]    = useState(false);
  const [editing,      setEditing]      = useState<MasteryTest | null>(null);
  const [delModal,     setDelModal]     = useState(false);
  const [delTarget,    setDelTarget]    = useState<MasteryTest | null>(null);
  const [tagMgr,       setTagMgr]       = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [filters,      setFilters]      = useState<ActiveFilters>({ subjectIds: [], tagIds: [] });

  const activeFilterCount = filters.subjectIds.length + filters.tagIds.length;

  const filteredTests = useMemo(() => {
    let result = [...tests];

    if (filters.subjectIds.length > 0) {
      result = result.filter(t => t.subjectEnabled && filters.subjectIds.includes(t.subjectId ?? ''));
    }

    if (filters.tagIds.length > 0) {
      result = result.filter(t =>
        (t.tags ?? []).some(tagId => filters.tagIds.includes(tagId))
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => {
        const subj = t.subjectEnabled && t.subjectId ? subjects.find(s => s.id === t.subjectId) : undefined;
        const tagNames = (t.tags ?? [])
          .map(id => allTags.find(tag => tag.id === id)?.name ?? '')
          .filter(Boolean);
        return (
          t.name.toLowerCase().includes(q) ||
          (t.topicLabel?.toLowerCase().includes(q) ?? false) ||
          (subj?.name.toLowerCase().includes(q) ?? false) ||
          tagNames.some(n => n.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [tests, search, subjects, filters, allTags]);

  const handleSaveTest = (form: TestForm) => {
    if (editing) {
      updateTest(editing.id, {
        name: form.name,
        subjectId: form.subjectEnabled ? (form.subjectId || undefined) : undefined,
        subjectEnabled: form.subjectEnabled,
        topicLabel: form.topicLabel || undefined,
        targetScore: form.targetScore,
        link: form.link || undefined,
        tags: form.tags,
      });
      addToast('Test updated');
    } else {
      addTest({
        name: form.name,
        subjectId: form.subjectEnabled ? (form.subjectId || undefined) : undefined,
        subjectEnabled: form.subjectEnabled,
        topicLabel: form.topicLabel || undefined,
        targetScore: form.targetScore,
        link: form.link || undefined,
        tags: form.tags,
      });
      addToast('Test added');
    }
    setTestModal(false);
    setEditing(null);
  };

  const openEdit = (t: MasteryTest) => { setEditing(t); setTestModal(true); };

  const requestDelete = (t: MasteryTest) => { setDelTarget(t); setDelModal(true); };
  const confirmDelete = () => {
    if (delTarget) { deleteTest(delTarget.id); addToast('Test deleted', 'info'); }
    setDelModal(false);
    setDelTarget(null);
  };

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <PageHeader
        title="Tests"
        subtitle={`${tests.length} test${tests.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setEditing(null); setTestModal(true); }}>
            Add Test
          </Button>
        }
      />

      {/* Filter + Search row */}
      {tests.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tests…"
              className="w-full pl-8 pr-4 py-2 rounded-xl text-sm font-body
                bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
                text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
          </div>

          <button
            onClick={() => setFilterOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-body font-medium border transition-all shrink-0
              ${activeFilterCount > 0
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30 dark:border-emerald-500/30'
                : 'bg-white dark:bg-ink-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-ink-700/50 hover:border-slate-300 dark:hover:border-ink-600/60'}`}
          >
            <SlidersHorizontal size={13} />
            Filters
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
            Tags
            {allTags.length > 0 && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
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

      {tests.length === 0 ? (
        <EmptyState
          icon={<FlaskConical size={24} />}
          title="No tests yet"
          description="Track your mastery test scores and monitor your progress toward the passing score."
          action={
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setTestModal(true)}>
              Add Test
            </Button>
          }
        />
      ) : filteredTests.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="No results"
          description={search ? `No tests matching "${search}".` : 'No tests matching your filters.'}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTests.map(test => (
            <TestCard
              key={test.id}
              test={test}
              onEdit={openEdit}
              onDelete={id => { const t = tests.find(t => t.id === id); if (t) requestDelete(t); }}
            />
          ))}
        </div>
      )}

      <TestModal
        open={testModal}
        initial={editing}
        defaultTarget={settings.targetPassingScore}
        subjects={subjects}
        onClose={() => { setTestModal(false); setEditing(null); }}
        onSave={handleSaveTest}
      />
      <DeleteModal
        open={delModal}
        label={delTarget?.name ?? ''}
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
    </div>
  );
};

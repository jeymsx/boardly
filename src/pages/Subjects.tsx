import React, { useState, useMemo } from 'react';
import { Plus, BookOpen, Search, Pencil, Trash2, ChevronLeft } from 'lucide-react';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { TopicCard } from '../components/TopicCard';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ColorPicker } from '../components/ui/ColorPicker';
import { EmptyState } from '../components/ui/EmptyState';
import { ProgressBar } from '../components/ui/ProgressBar';
import { subjectProgress, pctNum } from '../utils/progress';
import { COLOR_MAP } from '../types';
import type { Subject, Topic, SubjectColor } from '../types';

// ─── Add/Edit Subject Modal ───────────────────────────────────────────────────

interface SubjectForm { name: string; color: SubjectColor }

const SubjectModal: React.FC<{
  open: boolean;
  initial?: Subject | null;
  onClose: () => void;
  onSave: (form: SubjectForm) => void;
}> = ({ open, initial, onClose, onSave }) => {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [color, setColor] = useState<SubjectColor>(initial?.color ?? 'amber');

  React.useEffect(() => {
    if (open) { setName(initial?.name ?? ''); setColor(initial?.color ?? 'amber'); }
  }, [open, initial]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Subject' : 'New Subject'}>
      <div className="flex flex-col gap-4"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}>
        <Input
          label="Subject Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Plumbing Code"
          autoFocus
        />
        <div>
          <p className="text-xs font-body font-medium text-slate-400 uppercase tracking-wider mb-2">Color</p>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleSave} disabled={!name.trim()}>
            {initial ? 'Save' : 'Add Subject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Add/Edit Topic Modal ─────────────────────────────────────────────────────

interface TopicForm { name: string; totalReads: number; notes: string }

const TopicModal: React.FC<{
  open: boolean;
  subjectId: string | null;
  initial?: Topic | null;
  defaultReads: number;
  onClose: () => void;
  onSave: (subjectId: string, form: TopicForm) => void;
}> = ({ open, subjectId, initial, defaultReads, onClose, onSave }) => {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [reads, setReads] = useState(initial?.totalReads ?? defaultReads);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setReads(initial?.totalReads ?? defaultReads);
      setNotes(initial?.notes ?? '');
    }
  }, [open, initial, defaultReads]);

  const handleSave = () => {
    if (!name.trim() || !subjectId) return;
    onSave(subjectId, { name: name.trim(), totalReads: reads, notes });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Topic' : 'New Topic'}>
      <div className="flex flex-col gap-4"
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}>
        <Input label="Topic Name" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Water Distribution Systems" autoFocus />
        <Input label="Number of Reads" type="number" min={1} max={20} value={reads}
          onChange={e => setReads(Math.max(1, parseInt(e.target.value) || 1))}
          hint="How many times you plan to read this topic" />
        <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any notes or reminders..." rows={3} />
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleSave}
            disabled={!name.trim() || !subjectId}>
            {initial ? 'Save' : 'Add Topic'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal: React.FC<{
  open: boolean; label: string; onClose: () => void; onConfirm: () => void;
}> = ({ open, label, onClose, onConfirm }) => (
  <Modal open={open} onClose={onClose} title="Confirm Delete">
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
      Delete <span className="text-slate-800 dark:text-slate-200 font-medium">"{label}"</span>? This cannot be undone.
    </p>
    <div className="flex gap-2">
      <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
      <Button variant="danger" fullWidth onClick={onConfirm}>Delete</Button>
    </div>
  </Modal>
);

// ─── Subject List Item ────────────────────────────────────────────────────────

const SubjectItem: React.FC<{
  subject: Subject;
  topics: Topic[];
  active: boolean;
  onClick: () => void;
}> = ({ subject, topics, active, onClick }) => {
  const colors = COLOR_MAP[subject.color];
  const subjectTopics = topics.filter(t => t.subjectId === subject.id);
  const prog = subjectProgress(subject, topics);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
        ${active
          ? `${colors.bg} ${colors.border} border`
          : 'border border-transparent hover:bg-slate-50 dark:hover:bg-ink-800/60'}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-body font-medium truncate
          ${active ? colors.text : 'text-slate-700 dark:text-slate-300'}`}>
          {subject.name}
        </p>
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600 mt-0.5">
          {subjectTopics.length} topic{subjectTopics.length !== 1 ? 's' : ''} · {pctNum(prog)}%
        </p>
      </div>
    </button>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Subjects: React.FC = () => {
  const { subjects, topics, addSubject, updateSubject, deleteSubject, addTopic, updateTopic, deleteTopic } = useSubjectsStore();
  const { settings } = useSettingsStore();
  const { addToast }  = useToastStore();

  const [selectedId, setSelectedId] = useState<string | null>(subjects[0]?.id ?? null);

  // Sync selectedId when subjects change
  React.useEffect(() => {
    if (selectedId && !subjects.find(s => s.id === selectedId)) {
      setSelectedId(subjects[0]?.id ?? null);
    } else if (!selectedId && subjects.length > 0) {
      setSelectedId(subjects[0].id);
    }
  }, [subjects, selectedId]);

  const [topicSearch, setTopicSearch] = useState('');

  // Subject modal
  const [subjectModal,   setSubjectModal]   = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Topic modal
  const [topicModal,     setTopicModal]     = useState(false);
  const [topicSubjectId, setTopicSubjectId] = useState<string | null>(null);
  const [editingTopic,   setEditingTopic]   = useState<Topic | null>(null);

  // Delete modal
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subject' | 'topic'; id: string; label: string } | null>(null);

  const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedId) ?? null, [subjects, selectedId]);
  const selectedColors  = selectedSubject ? COLOR_MAP[selectedSubject.color] : COLOR_MAP.amber;

  const selectedTopics = useMemo(() => {
    const base = topics.filter(t => t.subjectId === selectedId);
    if (!topicSearch.trim()) return base;
    const q = topicSearch.toLowerCase();
    return base.filter(t => t.name.toLowerCase().includes(q));
  }, [topics, selectedId, topicSearch]);

  const openAddSubject  = () => { setEditingSubject(null); setSubjectModal(true); };
  const openEditSubject = (s: Subject) => { setEditingSubject(s); setSubjectModal(true); };

  const openAddTopic  = (subjectId: string) => { setTopicSubjectId(subjectId); setEditingTopic(null); setTopicModal(true); };
  const openEditTopic = (t: Topic)          => { setTopicSubjectId(t.subjectId); setEditingTopic(t); setTopicModal(true); };

  const handleSaveSubject = ({ name, color }: SubjectForm) => {
    if (editingSubject) { updateSubject(editingSubject.id, { name, color }); addToast('Subject updated'); }
    else {
      const newSubject = addSubject(name, color);
      setSelectedId(newSubject.id);
      addToast('Subject added');
    }
    setSubjectModal(false);
  };

  const handleSaveTopic = (subjectId: string, form: TopicForm) => {
    if (editingTopic) { updateTopic(editingTopic.id, { name: form.name, totalReads: form.totalReads, notes: form.notes }); addToast('Topic updated'); }
    else { addTopic(subjectId, form.name, form.totalReads); addToast('Topic added'); }
    setTopicModal(false);
  };

  const requestDelete = (type: 'subject' | 'topic', id: string, label: string) => {
    setDeleteTarget({ type, id, label });
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'subject') { deleteSubject(deleteTarget.id); addToast('Subject deleted', 'info'); }
    else { deleteTopic(deleteTarget.id); addToast('Topic deleted', 'info'); }
    setDeleteModal(false);
    setDeleteTarget(null);
  };

  // Mobile: whether we're "inside" a subject
  const [mobileIn, setMobileIn] = useState(false);

  const handleSelectSubject = (id: string) => {
    setSelectedId(id);
    setTopicSearch('');
    setMobileIn(true);
  };

  if (subjects.length === 0) {
    return (
      <div className="p-4 lg:p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">Subjects</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-body mt-0.5">0 subjects</p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAddSubject}>
            Add Subject
          </Button>
        </div>
        <EmptyState
          icon={<BookOpen size={24} />}
          title="No subjects yet"
          description="Add your first subject to start tracking your board exam review progress."
          action={
            <Button variant="primary" icon={<Plus size={14} />} onClick={openAddSubject}>
              Add Subject
            </Button>
          }
        />
        <SubjectModal open={subjectModal} initial={editingSubject}
          onClose={() => setSubjectModal(false)} onSave={handleSaveSubject} />
      </div>
    );
  }

  const subjectTopicsCount = topics.filter(t => t.subjectId === selectedId).length;
  const subjectProg = selectedSubject ? subjectProgress(selectedSubject, topics) : 0;

  return (
    <div className="flex h-full animate-fade-in">

      {/* ── Left sidebar ── */}
      <div className={`
        ${mobileIn ? 'hidden' : 'flex'} lg:flex
        flex-col w-full lg:w-56 shrink-0
        border-r border-slate-200 dark:border-ink-700/50
        bg-white dark:bg-ink-900/80
        h-full overflow-y-auto
      `}>
        <div className="px-3 pt-4 pb-3 border-b border-slate-100 dark:border-ink-700/40">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">Subjects</h2>
            <button
              onClick={openAddSubject}
              className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15
                flex items-center justify-center
                text-emerald-600 dark:text-emerald-400
                hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-600 font-mono">
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · {topics.length} topic{topics.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 p-2">
          {subjects.map(s => (
            <SubjectItem
              key={s.id}
              subject={s}
              topics={topics}
              active={s.id === selectedId}
              onClick={() => handleSelectSubject(s.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className={`
        ${!mobileIn ? 'hidden' : 'flex'} lg:flex
        flex-col flex-1 overflow-y-auto min-w-0
      `}>
        {selectedSubject ? (
          <>
            {/* Panel header */}
            <div className={`px-4 lg:px-6 pt-4 pb-3 border-b border-slate-100 dark:border-ink-700/40
              ${selectedColors.bg}`}>
              {/* Mobile back button */}
              <div className="flex items-center gap-2 mb-3 lg:hidden">
                <button onClick={() => setMobileIn(false)}
                  className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400
                    hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${selectedColors.dot}`} />
                  <div className="min-w-0">
                    <h2 className={`font-display font-bold text-lg ${selectedColors.text} truncate`}>
                      {selectedSubject.name}
                    </h2>
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                      {subjectTopicsCount} topic{subjectTopicsCount !== 1 ? 's' : ''} · {pctNum(subjectProg)}% complete
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditSubject(selectedSubject)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                      text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300
                      hover:bg-white/50 dark:hover:bg-ink-700/40 transition-all"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => requestDelete('subject', selectedSubject.id, selectedSubject.name)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                      text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400
                      hover:bg-rose-50/50 dark:hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {subjectTopicsCount > 0 && (
                <div className="mt-2.5">
                  <ProgressBar value={subjectProg} size="sm" color={selectedSubject.color as any} />
                </div>
              )}
            </div>

            {/* Topics toolbar */}
            <div className="flex items-center gap-2 px-4 lg:px-6 py-3 border-b border-slate-100 dark:border-ink-700/40">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={topicSearch}
                  onChange={e => setTopicSearch(e.target.value)}
                  placeholder="Search topics…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm font-body
                    bg-slate-50 dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
                    text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600
                    focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                />
              </div>
              <Button variant="primary" size="sm" icon={<Plus size={13} />}
                onClick={() => openAddTopic(selectedSubject.id)}>
                Add Topic
              </Button>
            </div>

            {/* Topics list */}
            <div className="flex-1 p-4 lg:p-6">
              {topics.filter(t => t.subjectId === selectedId).length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={20} />}
                  title="No topics yet"
                  description="Add topics to track your reading progress for this subject."
                  action={
                    <Button variant="primary" size="sm" icon={<Plus size={13} />}
                      onClick={() => openAddTopic(selectedSubject.id)}>
                      Add Topic
                    </Button>
                  }
                />
              ) : selectedTopics.length === 0 ? (
                <EmptyState
                  icon={<Search size={20} />}
                  title="No results"
                  description={`No topics matching "${topicSearch}".`}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {selectedTopics.map(topic => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      subject={selectedSubject}
                      onEdit={openEditTopic}
                      onDelete={id => {
                        const t = topics.find(t => t.id === id);
                        if (t) requestDelete('topic', id, t.name);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-slate-400 dark:text-slate-600">Select a subject to view its topics.</p>
          </div>
        )}
      </div>

      <SubjectModal open={subjectModal} initial={editingSubject}
        onClose={() => setSubjectModal(false)} onSave={handleSaveSubject} />
      <TopicModal
        open={topicModal} subjectId={topicSubjectId} initial={editingTopic}
        defaultReads={settings.defaultReadsPerTopic}
        onClose={() => setTopicModal(false)} onSave={handleSaveTopic}
      />
      <DeleteModal open={deleteModal} label={deleteTarget?.label ?? ''}
        onClose={() => setDeleteModal(false)} onConfirm={confirmDelete} />
    </div>
  );
};

import React, { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { SubjectCard } from '../components/SubjectCard';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ColorPicker } from '../components/ui/ColorPicker';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import type { Subject, Topic, SubjectColor } from '../types';

// ─── Add/Edit Subject Modal ───────────────────────────────────────────────────
interface SubjectForm { name: string; color: SubjectColor }

interface SubjectModalProps {
  open: boolean;
  initial?: Subject | null;
  onClose: () => void;
  onSave: (form: SubjectForm) => void;
}

const SubjectModal: React.FC<SubjectModalProps> = ({ open, initial, onClose, onSave }) => {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [color, setColor] = useState<SubjectColor>(initial?.color ?? 'amber');

  React.useEffect(() => {
    if (open) { setName(initial?.name ?? ''); setColor(initial?.color ?? 'amber'); }
  }, [open, initial]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Subject' : 'New Subject'}>
      <div className="flex flex-col gap-4">
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
          <Button variant="primary" fullWidth onClick={() => { onSave({ name: name.trim(), color }); }}
            disabled={!name.trim()}>
            {initial ? 'Save' : 'Add Subject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Add/Edit Topic Modal ─────────────────────────────────────────────────────
interface TopicForm { name: string; totalReads: number; notes: string }

interface TopicModalProps {
  open: boolean;
  subjectId: string | null;
  initial?: Topic | null;
  defaultReads: number;
  onClose: () => void;
  onSave: (subjectId: string, form: TopicForm) => void;
}

const TopicModal: React.FC<TopicModalProps> = ({
  open, subjectId, initial, defaultReads, onClose, onSave,
}) => {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [reads, setReads] = useState(initial?.totalReads ?? defaultReads);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  React.useEffect(() => {
    if (open) {
      setName(initial?.name   ?? '');
      setReads(initial?.totalReads ?? defaultReads);
      setNotes(initial?.notes ?? '');
    }
  }, [open, initial, defaultReads]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Topic' : 'New Topic'}>
      <div className="flex flex-col gap-4">
        <Input
          label="Topic Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Water Distribution Systems"
          autoFocus
        />
        <Input
          label="Number of Reads"
          type="number"
          min={1}
          max={20}
          value={reads}
          onChange={e => setReads(Math.max(1, parseInt(e.target.value) || 1))}
          hint="How many times you plan to read this topic"
        />
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any notes or reminders..."
          rows={3}
        />
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth
            onClick={() => { if (subjectId) onSave(subjectId, { name: name.trim(), totalReads: reads, notes }); }}
            disabled={!name.trim() || !subjectId}
          >
            {initial ? 'Save' : 'Add Topic'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
interface DeleteModalProps {
  open: boolean;
  label: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ open, label, onClose, onConfirm }) => (
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Subjects: React.FC = () => {
  const { subjects, topics, addSubject, updateSubject, deleteSubject, addTopic, updateTopic, deleteTopic } = useSubjectsStore();
  const { settings } = useSettingsStore();

  // Subject modal
  const [subjectModal, setSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Topic modal
  const [topicModal,    setTopicModal]    = useState(false);
  const [topicSubjectId, setTopicSubjectId] = useState<string | null>(null);
  const [editingTopic,  setEditingTopic]  = useState<Topic | null>(null);

  // Delete modal
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subject' | 'topic'; id: string; label: string } | null>(null);

  const openAddSubject  = () => { setEditingSubject(null); setSubjectModal(true); };
  const openEditSubject = (s: Subject) => { setEditingSubject(s); setSubjectModal(true); };

  const openAddTopic  = (subjectId: string) => { setTopicSubjectId(subjectId); setEditingTopic(null); setTopicModal(true); };
  const openEditTopic = (t: Topic)          => { setTopicSubjectId(t.subjectId); setEditingTopic(t); setTopicModal(true); };

  const handleSaveSubject = ({ name, color }: { name: string; color: SubjectColor }) => {
    if (editingSubject) updateSubject(editingSubject.id, { name, color });
    else addSubject(name, color);
    setSubjectModal(false);
  };

  const handleSaveTopic = (subjectId: string, form: { name: string; totalReads: number; notes: string }) => {
    if (editingTopic) updateTopic(editingTopic.id, { name: form.name, totalReads: form.totalReads, notes: form.notes });
    else addTopic(subjectId, form.name, form.totalReads);
    setTopicModal(false);
  };

  const requestDelete = (type: 'subject' | 'topic', id: string, label: string) => {
    setDeleteTarget({ type, id, label });
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'subject') deleteSubject(deleteTarget.id);
    else deleteTopic(deleteTarget.id);
    setDeleteModal(false);
    setDeleteTarget(null);
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Subjects"
        subtitle={`${subjects.length} subject${subjects.length !== 1 ? 's' : ''} · ${topics.length} topic${topics.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAddSubject}>
            Add Subject
          </Button>
        }
      />

      {subjects.length === 0 ? (
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
      ) : (
        <div className="flex flex-col gap-4">
          {subjects.map(subject => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEditSubject={openEditSubject}
              onDeleteSubject={(id) => {
                const s = subjects.find(s => s.id === id);
                if (s) requestDelete('subject', id, s.name);
              }}
              onAddTopic={openAddTopic}
              onEditTopic={openEditTopic}
              onDeleteTopic={(id) => {
                const t = topics.find(t => t.id === id);
                if (t) requestDelete('topic', id, t.name);
              }}
            />
          ))}
        </div>
      )}

      <SubjectModal
        open={subjectModal}
        initial={editingSubject}
        onClose={() => setSubjectModal(false)}
        onSave={handleSaveSubject}
      />
      <TopicModal
        open={topicModal}
        subjectId={topicSubjectId}
        initial={editingTopic}
        defaultReads={settings.defaultReadsPerTopic}
        onClose={() => setTopicModal(false)}
        onSave={handleSaveTopic}
      />
      <DeleteModal
        open={deleteModal}
        label={deleteTarget?.label ?? ''}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

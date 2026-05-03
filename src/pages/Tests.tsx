import React, { useState, useMemo } from 'react';
import { Plus, FlaskConical, Search } from 'lucide-react';
import { useTestsStore } from '../store/useTestsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { TestCard } from '../components/TestCard';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import type { MasteryTest } from '../types';

// ─── Test Form Modal ──────────────────────────────────────────────────────────

interface TestForm {
  name: string;
  subjectId: string;
  subjectEnabled: boolean;
  topicLabel: string;
  targetScore: number;
  link: string;
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
  const [name,           setName]           = useState(initial?.name           ?? '');
  const [subjectId,      setSubjectId]      = useState(initial?.subjectId      ?? (subjects[0]?.id ?? ''));
  const [subjectEnabled, setSubjectEnabled] = useState(initial?.subjectEnabled ?? true);
  const [topicLabel,     setTopicLabel]     = useState(initial?.topicLabel     ?? '');
  const [targetScore,    setTargetScore]    = useState(initial?.targetScore    ?? defaultTarget);
  const [link,           setLink]           = useState(initial?.link           ?? '');

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setSubjectId(initial?.subjectId ?? (subjects[0]?.id ?? ''));
      setSubjectEnabled(initial?.subjectEnabled ?? true);
      setTopicLabel(initial?.topicLabel ?? '');
      setTargetScore(initial?.targetScore ?? defaultTarget);
      setLink(initial?.link ?? '');
    }
  }, [open, initial, defaultTarget, subjects]);

  const handleSave = () => {
    if (!name.trim() || (subjectEnabled && !subjectId)) return;
    onSave({ name: name.trim(), subjectId, subjectEnabled, topicLabel, targetScore, link });
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Tests: React.FC = () => {
  const { tests, addTest, updateTest, deleteTest } = useTestsStore();
  const { subjects } = useSubjectsStore();
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();

  const [testModal,    setTestModal]    = useState(false);
  const [editing,      setEditing]      = useState<MasteryTest | null>(null);
  const [delModal,     setDelModal]     = useState(false);
  const [delTarget,    setDelTarget]    = useState<MasteryTest | null>(null);
  const [search,       setSearch]       = useState('');

  const filteredTests = useMemo(() => {
    if (!search.trim()) return tests;
    const q = search.toLowerCase();
    return tests.filter(t => {
      const subj = t.subjectEnabled && t.subjectId ? subjects.find(s => s.id === t.subjectId) : undefined;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.topicLabel?.toLowerCase().includes(q) ?? false) ||
        (subj?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tests, search, subjects]);

  const handleSaveTest = (form: TestForm) => {
    if (editing) {
      updateTest(editing.id, {
        name: form.name,
        subjectId: form.subjectEnabled ? (form.subjectId || undefined) : undefined,
        subjectEnabled: form.subjectEnabled,
        topicLabel: form.topicLabel || undefined,
        targetScore: form.targetScore,
        link: form.link || undefined,
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
        title="Mastery Tests"
        subtitle={`${tests.length} test${tests.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setEditing(null); setTestModal(true); }}>
            Add Test
          </Button>
        }
      />

      {/* Search */}
      {tests.length > 0 && (
        <div className="relative mb-4">
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
          description={`No tests matching "${search}".`}
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
    </div>
  );
};

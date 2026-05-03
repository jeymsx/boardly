import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, ChevronRight, ChevronLeft, TrendingUp, User, CalendarDays, BookOpen } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import type { ExamDate } from '../types';

interface Props {
  onComplete: () => void;
  onGoToLogin: () => void;
}

const STEPS = ['Profile', 'Exam Dates', 'Preferences'] as const;

const inputCls = `w-full bg-slate-50 dark:bg-ink-900/80
  border border-slate-200 dark:border-ink-600/60 rounded-xl px-4 py-3
  text-sm font-body text-slate-800 dark:text-slate-200
  placeholder-slate-400 dark:placeholder-slate-600
  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60
  transition-all`;

const labelCls = 'block text-xs font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

function SmallNumberInput({
  value, onChange, min, max,
}: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <input
      type="number" min={min} max={max} value={value}
      onChange={e => onChange(Math.min(max, Math.max(min, parseInt(e.target.value) || min)))}
      className="w-16 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
        rounded-xl px-3 py-2 text-sm font-mono text-emerald-600 dark:text-emerald-400 text-center
        focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
    />
  );
}

export const Onboarding: React.FC<Props> = ({ onComplete, onGoToLogin }) => {
  const { updateSettings } = useSettingsStore();

  const [step, setStep] = useState(0);

  // Step 0
  const [name, setName]         = useState('');
  const [examName, setExamName] = useState('');

  // Step 1
  const [examDates, setExamDates] = useState<ExamDate[]>([
    { id: uuid(), label: '', date: '' },
  ]);

  // Step 2
  const [defaultReads,   setDefaultReads]   = useState(3);
  const [defaultReviews, setDefaultReviews] = useState(3);
  const [targetScore,    setTargetScore]    = useState(90);

  // ── Validation ────────────────────────────────────────────────────────────
  const step0Valid = name.trim().length > 0 && examName.trim().length > 0;
  const step1Valid = examDates.some(d => d.date.trim().length > 0);

  const canNext = step === 0 ? step0Valid : step === 1 ? step1Valid : true;

  // ── Exam dates helpers ────────────────────────────────────────────────────
  const addDate = () =>
    setExamDates(d => [...d, { id: uuid(), label: '', date: '' }]);

  const updateDate = (id: string, patch: Partial<ExamDate>) =>
    setExamDates(d => d.map(ed => (ed.id === id ? { ...ed, ...patch } : ed)));

  const removeDate = (id: string) =>
    setExamDates(d => d.filter(ed => ed.id !== id));

  // ── Finish ────────────────────────────────────────────────────────────────
  const finish = () => {
    updateSettings({
      userName:                name.trim(),
      boardExamName:           examName.trim(),
      examDates:               examDates.filter(d => d.date.trim().length > 0),
      defaultReadsPerTopic:    defaultReads,
      defaultReviewsPerSession: defaultReviews,
      targetPassingScore:      targetScore,
    });
    localStorage.setItem('boardly:onboarded', 'true');
    onComplete();
  };

  const next = () => {
    if (!canNext) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const back = () => setStep(s => s - 1);

  // ── Step content ──────────────────────────────────────────────────────────
  const stepContent = [
    // Step 0 — Profile
    <div key="profile" className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15
          flex items-center justify-center">
          <User size={20} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">
            Let's get you set up
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-body mt-0.5">
            Tell us about yourself and your goal
          </p>
        </div>
      </div>

      <div>
        <label className={labelCls}>Your name</label>
        <input
          className={inputCls}
          placeholder="e.g. Juan dela Cruz"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className={labelCls}>Board exam</label>
        <input
          className={inputCls}
          placeholder="e.g. Plumbing Licensure Exam"
          value={examName}
          onChange={e => setExamName(e.target.value)}
        />
      </div>
    </div>,

    // Step 1 — Exam dates
    <div key="dates" className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-500/15
          flex items-center justify-center">
          <CalendarDays size={20} className="text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">
            When is your exam?
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-body mt-0.5">
            Add one or more exam dates for your countdown
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {examDates.map((ed, i) => (
          <div key={ed.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Label (e.g. Day ${i + 1})`}
              value={ed.label}
              onChange={e => updateDate(ed.id, { label: e.target.value })}
              className={`${inputCls} flex-1`}
            />
            <input
              type="date"
              value={ed.date}
              onChange={e => updateDate(ed.id, { date: e.target.value })}
              className="bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                rounded-xl px-3 py-3 text-sm font-mono text-slate-700 dark:text-slate-300
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
            {examDates.length > 1 && (
              <button
                onClick={() => removeDate(ed.id)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-ink-700/40
                  hover:bg-rose-50 dark:hover:bg-rose-500/20
                  flex items-center justify-center text-slate-400 dark:text-slate-500
                  hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-90 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addDate}
        className="flex items-center gap-1.5 text-sm font-body font-medium
          text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300
          transition-colors w-fit"
      >
        <Plus size={14} /> Add another date
      </button>

      {!step1Valid && examDates.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 font-body">
          Pick at least one date to continue.
        </p>
      )}
    </div>,

    // Step 2 — Preferences
    <div key="prefs" className="flex flex-col gap-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-500/15
          flex items-center justify-center">
          <BookOpen size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">
            Study preferences
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-body mt-0.5">
            Optional — you can change these later in Settings
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">
              Reads per topic
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              How many times you plan to read each topic
            </p>
          </div>
          <SmallNumberInput value={defaultReads} onChange={setDefaultReads} min={1} max={20} />
        </div>

        <div className="h-px bg-slate-100 dark:bg-ink-700/60" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">
              Reviews per session
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Auto-scheduled review tasks after each class
            </p>
          </div>
          <SmallNumberInput value={defaultReviews} onChange={setDefaultReviews} min={0} max={10} />
        </div>

        <div className="h-px bg-slate-100 dark:bg-ink-700/60" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">
              Target passing score
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Minimum score to mark a test as passed
            </p>
          </div>
          <div className="flex items-center gap-1">
            <SmallNumberInput value={targetScore} onChange={setTargetScore} min={1} max={100} />
            <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">%</span>
          </div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-ink-950">
      {/* Background texture */}
      <div className="absolute inset-0 bg-grid-light dark:bg-grid-ink opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-4
        border-b border-slate-200 dark:border-ink-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <TrendingUp size={14} className="text-white stroke-[2.5]" />
          </div>
          <span className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
            Boardly
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Setup {step + 1}/{STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1 bg-slate-200 dark:bg-ink-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="relative flex items-center justify-center gap-2 py-4">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 transition-all duration-300
              ${i === step ? 'opacity-100' : 'opacity-40'}`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold
                transition-all duration-300
                ${i <= step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 dark:bg-ink-700 text-slate-500 dark:text-slate-500'}`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i === step && (
                <span className="text-xs font-body font-medium text-slate-600 dark:text-slate-400">
                  {label}
                </span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px transition-all duration-300
                ${i < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-ink-700'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-5 py-4">
          {stepContent[step]}
        </div>
      </div>

      {/* Navigation */}
      <div className="relative px-5 py-4 border-t border-slate-200 dark:border-ink-800/60
        bg-white/80 dark:bg-ink-950/80 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <div className="flex gap-3">
            {step > 0 ? (
              <button
                onClick={back}
                className="flex items-center gap-2 px-4 py-3 rounded-xl
                  bg-slate-100 dark:bg-ink-800 border border-slate-200 dark:border-ink-700/50
                  text-sm font-body font-medium text-slate-600 dark:text-slate-400
                  hover:bg-slate-200 dark:hover:bg-ink-700 transition-all active:scale-95"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <div className="flex-1" />
            )}

            <button
              onClick={next}
              disabled={!canNext}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                text-sm font-body font-semibold transition-all active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {step === STEPS.length - 1 ? "Let's go!" : 'Next'}
              {step < STEPS.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>

          {/* Returning user link — always visible */}
          <p className="text-center text-xs font-body text-slate-400 dark:text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onGoToLogin}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { RotateCcw, Plus, Trash2, Sun, Moon, User, Tag, CloudUpload, CloudOff, Loader2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal } from '../components/AuthModal';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/layout/PageHeader';
import { DEFAULT_PAGE_LABELS } from '../types';
import type { ExamDate, PageLabels } from '../types';

interface SectionProps { title: string; description?: string; children: React.ReactNode }

const Section: React.FC<SectionProps> = ({ title, description, children }) => (
  <div className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
    rounded-2xl overflow-hidden mb-4 shadow-card dark:shadow-none">
    <div className="px-5 py-4 border-b border-slate-100 dark:border-ink-700/40">
      <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">{title}</h2>
      {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-body">{description}</p>}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

interface ToggleProps { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }

const Toggle: React.FC<ToggleProps> = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">{label}</p>
      {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{ height: '22px' }}
      className={`relative w-10 rounded-full transition-all active:scale-95 flex-shrink-0
        ${value
          ? 'bg-emerald-500'
          : 'bg-slate-200 dark:bg-ink-600 border border-slate-300 dark:border-ink-500'}`}
    >
      <span
        className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all
          ${value ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  </div>
);

const NumberInput: React.FC<{ value: number; onChange: (v: number) => void; min: number; max: number }> = ({ value, onChange, min, max }) => (
  <input
    type="number" min={min} max={max} value={value}
    onChange={e => onChange(Math.min(max, Math.max(min, parseInt(e.target.value) || min)))}
    className="w-16 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
      rounded-xl px-3 py-2 text-sm font-mono text-emerald-600 dark:text-emerald-400 text-center
      focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
  />
);

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const { user, signOut, syncing } = useAuthStore();
  const [resetModal,      setResetModal]      = useState(false);
  const [onboardingModal, setOnboardingModal] = useState(false);
  const [authModal,    setAuthModal]    = useState(false);
  const [newInterval,  setNewInterval]  = useState('');

  const examDates: ExamDate[] = settings.examDates ?? [];

  const addInterval = () => {
    const v = parseInt(newInterval);
    if (!isNaN(v) && v > 0 && !settings.reviewIntervals.includes(v)) {
      updateSettings({ reviewIntervals: [...settings.reviewIntervals, v].sort((a, b) => a - b) });
    }
    setNewInterval('');
  };

  const addExamDate = () => {
    const newDate: ExamDate = { id: uuid(), label: '', date: '' };
    updateSettings({ examDates: [...examDates, newDate] });
  };

  const updateExamDate = (id: string, patch: Partial<ExamDate>) => {
    updateSettings({
      examDates: examDates.map(ed => ed.id === id ? { ...ed, ...patch } : ed),
    });
  };

  const removeExamDate = (id: string) => {
    updateSettings({ examDates: examDates.filter(ed => ed.id !== id) });
  };

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <PageHeader title="Settings" subtitle="Configure default values and behaviors" />

      {authModal && <AuthModal onClose={() => setAuthModal(false)} />}

      {/* Two-column layout on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 lg:items-start">

        {/* ── Left column: account / identity ── */}
        <div>
          {/* Account / Sync */}
          <Section
            title="Account"
            description={user ? 'Your data syncs automatically in the background' : 'Sign in to back up and sync across devices'}
          >
            {user ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15
                    border border-emerald-200 dark:border-emerald-500/25
                    flex items-center justify-center shrink-0">
                    {syncing
                      ? <Loader2 size={14} className="text-emerald-600 dark:text-emerald-400 animate-spin" />
                      : <CloudUpload size={14} className="text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {user.email}
                    </p>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      {syncing ? 'Syncing…' : 'Sync enabled'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium
                    border-slate-200 dark:border-ink-600/60 text-slate-500 dark:text-slate-400
                    hover:border-rose-300 dark:hover:border-rose-500/40
                    hover:text-rose-600 dark:hover:text-rose-400
                    hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                >
                  <CloudOff size={12} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-ink-700/60
                    border border-slate-200 dark:border-ink-600/40
                    flex items-center justify-center shrink-0">
                    <CloudOff size={14} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-body text-slate-400 dark:text-slate-500">
                    Offline — data stored locally
                  </p>
                </div>
                <button
                  onClick={() => setAuthModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    bg-emerald-500 hover:bg-emerald-600 active:scale-95
                    text-white text-xs font-mono font-semibold transition-all"
                >
                  <CloudUpload size={12} /> Sign In
                </button>
              </div>
            )}
          </Section>

          {/* Profile */}
          <Section title="Profile" description="Your name and the exam you're preparing for">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Your name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Juan dela Cruz"
                    value={settings.userName ?? ''}
                    onChange={e => updateSettings({ userName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                      rounded-xl pl-9 pr-4 py-2.5 text-sm font-body text-slate-800 dark:text-slate-200
                      placeholder-slate-400 dark:placeholder-slate-600
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Board exam
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plumbing Licensure Exam"
                  value={settings.boardExamName ?? ''}
                  onChange={e => updateSettings({ boardExamName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                    rounded-xl px-4 py-2.5 text-sm font-body text-slate-800 dark:text-slate-200
                    placeholder-slate-400 dark:placeholder-slate-600
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all"
                />
              </div>
            </div>
          </Section>

          {/* Appearance */}
          <Section title="Appearance" description="Theme and display preferences">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">Theme</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Currently: <span className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">{theme} mode</span>
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-body font-medium
                  transition-all active:scale-95
                  ${theme === 'dark'
                    ? 'bg-ink-700 border-ink-600 text-slate-200 hover:bg-ink-600'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              >
                {theme === 'dark'
                  ? <><Sun size={15} className="text-emerald-400" /> Light mode</>
                  : <><Moon size={15} className="text-emerald-600" /> Dark mode</>
                }
              </button>
            </div>
          </Section>

          {/* Board Exam Dates */}
          <Section title="Board Exam Dates" description="Track countdowns to each day of your board exam">
            <div className="flex flex-col gap-3">
              {examDates.map((ed) => (
                <div
                  key={ed.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(8.75rem,1fr)_2rem] items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Label (e.g. Day 1)"
                    value={ed.label}
                    onChange={e => updateExamDate(ed.id, { label: e.target.value })}
                    className="min-w-0 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                      rounded-xl px-3 py-2 text-sm font-body text-slate-700 dark:text-slate-300
                      placeholder-slate-400 dark:placeholder-slate-600
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  />
                  <input
                    type="date"
                    value={ed.date}
                    onChange={e => updateExamDate(ed.id, { date: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                      rounded-xl px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-300
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  />
                  <button
                    onClick={() => removeExamDate(ed.id)}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-ink-700/40 hover:bg-rose-50 dark:hover:bg-rose-500/20
                      flex items-center justify-center text-slate-400 dark:text-slate-500
                      hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-90"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addExamDate}
                className="flex items-center gap-1.5 text-sm font-body font-medium
                  text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300
                  transition-colors w-fit"
              >
                <Plus size={14} /> Add Exam Date
              </button>
            </div>
          </Section>

          {/* Danger zone */}
          <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-rose-100 dark:border-rose-500/15">
              <h2 className="font-display font-semibold text-sm text-rose-600 dark:text-rose-400">Danger Zone</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-body">Irreversible actions - proceed carefully</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">Reset Settings</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-body">Restore all settings to their defaults</p>
                </div>
                <Button variant="danger" size="sm" icon={<RotateCcw size={13} />} onClick={() => setResetModal(true)}>
                  Reset
                </Button>
              </div>
              <div className="border-t border-rose-100 dark:border-rose-500/15" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">Reset Onboarding</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-body">Walk through the initial setup again on next load</p>
                </div>
                <Button variant="danger" size="sm" icon={<RotateCcw size={13} />} onClick={() => setOnboardingModal(true)}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column: study settings ── */}
        <div>
          {/* Reading defaults */}
          <Section title="Reading Defaults" description="These values apply when adding new topics">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">Default Reads per Topic</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">How many reads are created when adding a topic</p>
              </div>
              <NumberInput value={settings.defaultReadsPerTopic} onChange={v => updateSettings({ defaultReadsPerTopic: v })} min={1} max={20} />
            </div>
          </Section>

          {/* Session defaults */}
          <Section title="Session & Review Defaults" description="Applied when creating new lecture sessions">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">Default Reviews per Session</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Number of review tasks auto-scheduled per session</p>
                </div>
                <NumberInput value={settings.defaultReviewsPerSession} onChange={v => updateSettings({ defaultReviewsPerSession: v })} min={0} max={10} />
              </div>

              <Toggle
                label="Auto-generate reviews"
                description="Automatically schedule reviews when adding a new session"
                value={settings.autoGenerateReviews}
                onChange={v => updateSettings({ autoGenerateReviews: v })}
              />

              <div>
                <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300 mb-1">Review Intervals (days)</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Reviews are scheduled this many days after the session date</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {settings.reviewIntervals.map(v => (
                    <div key={v}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                        bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25
                        text-sm font-mono text-emerald-700 dark:text-emerald-300"
                    >
                      +{v}d
                      <button
                        onClick={() => updateSettings({ reviewIntervals: settings.reviewIntervals.filter(i => i !== v) })}
                        className="ml-1 text-emerald-500/60 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={1} value={newInterval}
                      onChange={e => setNewInterval(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addInterval()}
                      placeholder="+day"
                      className="w-16 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                        rounded-lg px-2 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300
                        placeholder-slate-400 dark:placeholder-slate-700
                        focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                    <button
                      onClick={addInterval}
                      disabled={!newInterval}
                      className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15
                        hover:bg-emerald-100 dark:hover:bg-emerald-500/25
                        border border-emerald-200 dark:border-emerald-500/30
                        flex items-center justify-center text-emerald-600 dark:text-emerald-400
                        disabled:opacity-30 transition-all active:scale-90"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Test defaults */}
          <Section title="Mastery Tests" description="Score targets and evaluation settings">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-300">Default Target Passing Score</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Applied when creating a new test</p>
              </div>
              <div className="flex items-center gap-1">
                <NumberInput value={settings.targetPassingScore} onChange={v => updateSettings({ targetPassingScore: v })} min={1} max={100} />
                <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">%</span>
              </div>
            </div>
          </Section>

          {/* Page Labels */}
          <Section title="Page Labels" description="Rename any navigation page to fit your workflow">
            <div className="flex flex-col gap-3">
              {(Object.keys(DEFAULT_PAGE_LABELS) as (keyof PageLabels)[]).map(key => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-24 shrink-0">
                    <Tag size={11} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500 capitalize">
                      {DEFAULT_PAGE_LABELS[key]}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={settings.pageLabels?.[key] ?? DEFAULT_PAGE_LABELS[key]}
                    onChange={e => {
                      const next = { ...DEFAULT_PAGE_LABELS, ...settings.pageLabels, [key]: e.target.value };
                      updateSettings({ pageLabels: next });
                    }}
                    placeholder={DEFAULT_PAGE_LABELS[key]}
                    className="flex-1 bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                      rounded-xl px-3 py-2 text-sm font-body text-slate-800 dark:text-slate-200
                      placeholder-slate-400 dark:placeholder-slate-600
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all"
                  />
                  {(settings.pageLabels?.[key] ?? DEFAULT_PAGE_LABELS[key]) !== DEFAULT_PAGE_LABELS[key] && (
                    <button
                      onClick={() => {
                        const next = { ...DEFAULT_PAGE_LABELS, ...settings.pageLabels, [key]: DEFAULT_PAGE_LABELS[key] };
                        updateSettings({ pageLabels: next });
                      }}
                      className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hover:text-rose-500
                        dark:hover:text-rose-400 transition-colors shrink-0"
                      title="Reset to default"
                    >
                      reset
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>

      </div>{/* end 2-col grid */}

      <Modal open={resetModal} onClose={() => setResetModal(false)} title="Reset Settings">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          This will restore all settings to their defaults. Your subjects, topics, sessions, and test data won't be affected.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={() => setResetModal(false)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={() => { resetSettings(); setResetModal(false); }}>Reset</Button>
        </div>
      </Modal>

      <Modal open={onboardingModal} onClose={() => setOnboardingModal(false)} title="Reset Onboarding">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          The app will reload and show the onboarding screen again. Your data won't be affected.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={() => setOnboardingModal(false)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={() => {
            localStorage.removeItem('boardly:onboarded');
            window.location.reload();
          }}>
            Reset &amp; Reload
          </Button>
        </div>
      </Modal>
    </div>
  );
};

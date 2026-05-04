import React from 'react';
import { LayoutDashboard, BookOpen, CalendarDays, FlaskConical, Settings2, GraduationCap } from 'lucide-react';
import { useNavStore } from '../../store/useNavStore';
import { useSubjectsStore } from '../../store/useSubjectsStore';
import { useSessionsStore } from '../../store/useSessionsStore';
import { useTestsStore } from '../../store/useTestsStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { overallProgress, pctNum } from '../../utils/progress';
import { ProgressBar } from '../ui/ProgressBar';
import { DEFAULT_PAGE_LABELS } from '../../types';
import type { NavPage } from '../../types';

interface NavItem { page: NavPage; icon: React.ReactNode }

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', icon: <LayoutDashboard size={18} /> },
  { page: 'subjects',  icon: <BookOpen size={18} /> },
  { page: 'sessions',  icon: <GraduationCap size={18} /> },
  { page: 'tests',     icon: <FlaskConical size={18} /> },
  { page: 'calendar',  icon: <CalendarDays size={18} /> },
  { page: 'settings',  icon: <Settings2 size={18} /> },
];

export const Sidebar: React.FC = () => {
  const { page, navigate } = useNavStore();
  const { subjects, topics } = useSubjectsStore();
  const { sessions } = useSessionsStore();
  const { tests } = useTestsStore();
  const { settings } = useSettingsStore();

  const overall = overallProgress(subjects, topics, sessions, tests, settings.targetPassingScore);
  const labels  = { ...DEFAULT_PAGE_LABELS, ...settings.pageLabels };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0
      bg-white dark:bg-ink-900/95 border-r border-slate-200 dark:border-ink-700/50
      backdrop-blur-xl transition-colors duration-200"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="Boardly" className="w-8 h-8 rounded-xl" />
          <span className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight">
            Boardly
          </span>
        </div>
      </div>

      {/* Overall Progress Card */}
      <div className="mx-3 mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-ink-800/60
        border border-emerald-100 dark:border-ink-700/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-body font-medium text-slate-500 dark:text-slate-500 uppercase tracking-widest">
            Overall
          </span>
          <span className="text-sm font-mono font-medium text-emerald-600 dark:text-emerald-400">
            {pctNum(overall)}%
          </span>
        </div>
        <ProgressBar value={overall} size="md" color="emerald" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const active = page === item.page;
          return (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium
                transition-all active:scale-[0.98] text-left
                ${active
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-ink-800/60 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
                }`}
            >
              <span className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>
                {item.icon}
              </span>
              {labels[item.page]}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100 dark:border-ink-700/40">
        <p className="text-[11px] text-slate-400 dark:text-slate-600 font-body">Boardly v1.0</p>
        <p className="text-[10px] text-slate-300 dark:text-slate-700 font-body mt-0.5">Board Exam Review Tracker</p>
      </div>
    </aside>
  );
};

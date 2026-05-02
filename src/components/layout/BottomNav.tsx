import React from 'react';
import { LayoutDashboard, BookOpen, CalendarDays, FlaskConical, Settings2, GraduationCap } from 'lucide-react';
import { useNavStore } from '../../store/useNavStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { DEFAULT_PAGE_LABELS } from '../../types';
import type { NavPage } from '../../types';

interface NavItem { page: NavPage; icon: React.ReactNode }

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', icon: <LayoutDashboard size={20} /> },
  { page: 'subjects',  icon: <BookOpen size={20} /> },
  { page: 'sessions',  icon: <GraduationCap size={20} /> },
  { page: 'tests',     icon: <FlaskConical size={20} /> },
  { page: 'calendar',  icon: <CalendarDays size={20} /> },
  { page: 'settings',  icon: <Settings2 size={20} /> },
];

export const BottomNav: React.FC = () => {
  const { page, navigate } = useNavStore();
  const { settings } = useSettingsStore();
  const labels = { ...DEFAULT_PAGE_LABELS, ...settings.pageLabels };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden
      bg-white/95 dark:bg-ink-900/95 backdrop-blur-xl
      border-t border-slate-200 dark:border-ink-700/60 safe-area-pb"
    >
      <div className="flex items-center">
        {NAV_ITEMS.map(item => {
          const active = page === item.page;
          return (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 transition-all active:scale-90
                ${active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className={`transition-transform ${active ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[10px] font-body font-medium tracking-wide truncate max-w-full px-0.5">
                {labels[item.page]}
              </span>
              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

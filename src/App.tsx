import { useState, useEffect } from 'react';
import { useNavStore } from './store/useNavStore';
import { useThemeStore } from './store/useThemeStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useAuthStore } from './store/useAuthStore';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Subjects } from './pages/Subjects';
import { Sessions } from './pages/Sessions';
import { Tests } from './pages/Tests';
import { Calendar } from './pages/Calendar';
import { Settings } from './pages/Settings';
import { Onboarding } from './components/Onboarding';
import { DEFAULT_PAGE_LABELS } from './types';
import { TrendingUp } from 'lucide-react';

const PAGE_MAP = {
  dashboard: Dashboard, subjects: Subjects, sessions: Sessions,
  tests: Tests, calendar: Calendar, settings: Settings,
};

export default function App() {
  const { page } = useNavStore();
  useThemeStore(); // ensure store is initialized (applies dark class on load)
  const { settings } = useSettingsStore();
  const { initialize } = useAuthStore();
  const PageComponent = PAGE_MAP[page];
  const labels = { ...DEFAULT_PAGE_LABELS, ...settings.pageLabels };
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('boardly:onboarded') !== 'true',
  );

  // Initialize Supabase auth on mount — starts session check + onAuthStateChange listener.
  useEffect(() => { initialize(); }, [initialize]);

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-ink-950 transition-colors duration-200">
      {/* Background texture */}
      <div className="fixed inset-0 bg-grid-light dark:bg-grid-ink opacity-20 dark:opacity-20 pointer-events-none" />

      <Sidebar />

      <main className="flex-1 flex flex-col min-h-dvh overflow-y-auto">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3
          bg-white/90 dark:bg-ink-950/90 backdrop-blur-xl
          border-b border-slate-200 dark:border-ink-800/60"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingUp size={14} className="text-white stroke-[2.5]" />
            </div>
            <span className="font-display font-bold text-base text-slate-900 dark:text-slate-100">Boardly</span>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {labels[page]}
          </span>
        </header>

        <div className="flex-1 pb-24 lg:pb-6">
          <PageComponent key={page} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

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
import { Toaster } from './components/ui/Toaster';

const PAGE_MAP = {
  dashboard: Dashboard, subjects: Subjects, sessions: Sessions,
  tests: Tests, calendar: Calendar, settings: Settings,
};

export default function App() {
  const { page } = useNavStore();
  useThemeStore(); // ensure store is initialized (applies dark class on load)
  useSettingsStore(); // keep store initialized for settings reactivity
  const { initialize } = useAuthStore();
  const PageComponent = PAGE_MAP[page];
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

      <main className="flex-1 flex flex-col h-dvh overflow-y-auto">
        <div className="flex-1 pb-24 lg:pb-6">
          <PageComponent key={page} />
        </div>
      </main>

      <BottomNav />
      <Toaster />
    </div>
  );
}

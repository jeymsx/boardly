import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
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
import { AuthScreen } from './components/AuthScreen';
import { Toaster } from './components/ui/Toaster';

const PAGE_MAP = {
  dashboard: Dashboard, subjects: Subjects, sessions: Sessions,
  tests: Tests, calendar: Calendar, settings: Settings,
};

// ─── Loading splash ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4
      bg-slate-50 dark:bg-ink-950">
      <div className="absolute inset-0 bg-grid-light dark:bg-grid-ink opacity-20 pointer-events-none" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center
          shadow-glow-emerald animate-pulse">
          <TrendingUp size={22} className="text-white stroke-[2.5]" />
        </div>
        <span className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
          Boardly
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

type OnboardingView = 'onboarding' | 'auth';

export default function App() {
  const { page } = useNavStore();
  useThemeStore();
  useSettingsStore();
  const { initialize, initialized, user } = useAuthStore();
  const PageComponent = PAGE_MAP[page];

  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('boardly:onboarded') !== 'true',
  );
  const [obView, setObView] = useState<OnboardingView>('onboarding');

  // Initialize Supabase auth once on mount.
  useEffect(() => { initialize(); }, [initialize]);

  // If auth resolves with an existing session, skip onboarding entirely.
  useEffect(() => {
    if (initialized && user && showOnboarding) {
      localStorage.setItem('boardly:onboarded', 'true');
      setShowOnboarding(false);
    }
  }, [initialized, user, showOnboarding]);

  // Wait for auth check before rendering — prevents onboarding flash for returning users.
  if (!initialized) {
    return <LoadingScreen />;
  }

  // ── Pre-app screens ─────────────────────────────────────────────────────────

  if (showOnboarding) {
    const completeOnboarding = () => {
      localStorage.setItem('boardly:onboarded', 'true');
      setShowOnboarding(false);
    };

    if (obView === 'auth') {
      return (
        <AuthScreen
          onComplete={completeOnboarding}
          onBack={() => setObView('onboarding')}
        />
      );
    }

    return (
      <Onboarding
        onComplete={completeOnboarding}
        onGoToLogin={() => setObView('auth')}
      />
    );
  }

  // ── Main app ────────────────────────────────────────────────────────────────

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

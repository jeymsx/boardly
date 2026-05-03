import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, Loader2, ArrowLeft, CloudUpload } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

// SVG Google "G" logo
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

type Tab = 'in' | 'up';

export const AuthScreen: React.FC<Props> = ({ onComplete, onBack }) => {
  const { signIn, signUp } = useAuthStore();

  const [tab,           setTab]           = useState<Tab>('in');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const switchTab = (t: Tab) => { setTab(t); setError(null); };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = tab === 'in'
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onComplete();
    }
  };

  const inputCls = `w-full bg-slate-50 dark:bg-ink-900/80
    border border-slate-200 dark:border-ink-600/60 rounded-xl pl-10 pr-4 py-3
    text-sm font-body text-slate-800 dark:text-slate-200
    placeholder-slate-400 dark:placeholder-slate-600
    focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60
    transition-all`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-ink-950 animate-fade-in">
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
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-body font-medium
            text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300
            transition-colors"
        >
          <ArrowLeft size={13} />
          Back to setup
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">

          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center
              shadow-glow-emerald/20 shrink-0">
              <CloudUpload size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100">
                {tab === 'in' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-xs font-body text-slate-400 dark:text-slate-500 mt-0.5">
                {tab === 'in'
                  ? 'Sign in to sync your study data'
                  : 'Create an account to sync across devices'}
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-100 dark:bg-ink-800/60 p-1 rounded-xl mb-5
            border border-slate-200 dark:border-ink-700/50">
            {(['in', 'up'] as const).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold transition-all
                  ${tab === t
                    ? 'bg-white dark:bg-ink-700 text-slate-800 dark:text-slate-200 shadow-sm'
                    : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
              >
                {t === 'in' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl mb-4
              bg-white dark:bg-ink-700/60 border border-slate-200 dark:border-ink-600/60
              hover:bg-slate-50 dark:hover:bg-ink-700 active:scale-[0.98]
              text-slate-700 dark:text-slate-200 text-sm font-body font-medium
              disabled:opacity-50 transition-all shadow-sm"
          >
            {googleLoading
              ? <Loader2 size={15} className="animate-spin text-slate-400" />
              : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-ink-700/60" />
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-ink-700/60" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="password"
                required
                autoComplete={tab === 'in' ? 'current-password' : 'new-password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>

            {error && (
              <p className="text-xs font-body text-rose-600 dark:text-rose-400
                bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20
                rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl mt-1
                bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]
                text-white text-sm font-display font-semibold
                disabled:opacity-60 transition-all shadow-glow-emerald/20"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> {tab === 'in' ? 'Signing in…' : 'Creating account…'}</>
                : tab === 'in' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Switch tab hint */}
          <p className="text-center text-xs font-body text-slate-400 dark:text-slate-600 mt-4">
            {tab === 'in' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchTab(tab === 'in' ? 'up' : 'in')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium transition-colors"
            >
              {tab === 'in' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>

      {/* Footer */}
      <div className="relative px-5 py-4 border-t border-slate-200 dark:border-ink-800/60
        bg-white/80 dark:bg-ink-950/80 backdrop-blur-sm text-center">
        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-body text-slate-400 dark:text-slate-600
            hover:text-slate-500 dark:hover:text-slate-500 transition-colors"
        >
          Continue without an account →
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Mail, Lock, CloudUpload, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

interface Props {
  onClose: () => void;
}

// SVG Google "G" logo — no external dependency needed.
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export const AuthModal: React.FC<Props> = ({ onClose }) => {
  const { signIn, signUp } = useAuthStore();
  const [tab,      setTab]      = useState<'in' | 'up'>('in');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const reset = (nextTab: 'in' | 'up') => {
    setTab(nextTab);
    setError(null);
  };

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
    // On success the browser redirects — no need to close modal manually.
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
      // Email confirmation is disabled — user is signed in immediately.
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white dark:bg-ink-800 rounded-2xl shadow-2xl
        border border-slate-200 dark:border-ink-700/60 overflow-hidden animate-scale-in">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <CloudUpload size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                {tab === 'in' ? 'Sign in' : 'Create account'}
              </h2>
              <p className="text-xs font-body text-slate-400 dark:text-slate-500">
                Sync your data across devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400
              hover:bg-slate-100 dark:hover:bg-ink-700/60 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-4 flex gap-1 border-b border-slate-100 dark:border-ink-700/40">
          {(['in', 'up'] as const).map(t => (
            <button
              key={t}
              onClick={() => reset(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all
                ${tab === t
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              {t === 'in' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-3">

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl
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
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-ink-700/60" />
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-ink-700/60" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                  rounded-xl pl-9 pr-4 py-2.5 text-sm font-body text-slate-800 dark:text-slate-200
                  placeholder-slate-400 dark:placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all"
              />
            </div>

            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                required
                autoComplete={tab === 'in' ? 'current-password' : 'new-password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-ink-900/80 border border-slate-200 dark:border-ink-600/60
                  rounded-xl pl-9 pr-4 py-2.5 text-sm font-body text-slate-800 dark:text-slate-200
                  placeholder-slate-400 dark:placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all"
              />
            </div>

            {error && (
              <p className="text-xs font-body text-rose-600 dark:text-rose-400
                bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20
                rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]
                text-white text-sm font-display font-semibold
                disabled:opacity-60 transition-all"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> {tab === 'in' ? 'Signing in…' : 'Creating account…'}</>
                : tab === 'in' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <button
            type="button"
            onClick={onClose}
            className="text-center text-xs font-body text-slate-400 dark:text-slate-600
              hover:text-slate-500 dark:hover:text-slate-500 transition-colors"
          >
            Continue without an account →
          </button>
        </div>
      </div>
    </div>
  );
};

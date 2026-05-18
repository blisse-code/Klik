import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

interface AuthViewProps {
  onBackToLanding?: () => void;
}

export function AuthView({ onBackToLanding }: AuthViewProps = {}) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#1A1A1C] text-white p-6 justify-center relative">
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-1 py-1"
        >
          <ArrowLeft className="w-3 h-3" aria-hidden />
          Home
        </button>
      )}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
          <Camera className="w-7 h-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Klik</h1>
        <p className="text-[11px] text-white/75 uppercase tracking-widest mt-1">
          AI camera, your style
        </p>
      </div>

      <div
        className="flex bg-black/60 rounded-lg p-1 mb-6 border border-white/10"
        role="tablist"
        aria-label="Authentication mode"
      >
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setMessage(null);
            }}
            className={cn(
              'flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
              mode === m ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white'
            )}
          >
            {m === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="auth-email" className="sr-only">Email</label>
        <input
          id="auth-email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-3 bg-black/60 border border-white/15 rounded-lg text-sm placeholder-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400"
        />
        <label htmlFor="auth-password" className="sr-only">Password</label>
        <input
          id="auth-password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-3 bg-black/60 border border-white/15 rounded-lg text-sm placeholder-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400"
        />

        {error && (
          <p
            className="text-xs text-red-200 bg-red-500/20 border border-red-400/40 rounded-md px-3 py-2"
            role="alert"
          >
            {error}
          </p>
        )}
        {message && (
          <p
            className="text-xs text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 rounded-md px-3 py-2"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1C]"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <span>{mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
          )}
        </button>
      </form>

      <p className="text-[11px] text-white/70 text-center mt-6 leading-relaxed">
        Sign in to save your provider keys and renders. Once you're in, you can
        use Basic mode (local WebGL filters) without adding any API keys.
      </p>
    </div>
  );
}

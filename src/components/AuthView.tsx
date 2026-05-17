import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export function AuthView() {
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
    <div className="flex flex-col w-full h-full bg-[#1A1A1C] text-white p-6 justify-center">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
          <Camera className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Klik</h1>
        <p className="text-[11px] text-white/50 uppercase tracking-widest mt-1">
          AI camera, your style
        </p>
      </div>

      <div className="flex bg-black/40 rounded-lg p-1 mb-6 border border-white/5">
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setMessage(null);
            }}
            className={cn(
              'flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors',
              mode === m ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
            )}
          >
            {m === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-lg text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-lg text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
        />

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {message && (
          <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>{mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
          )}
        </button>
      </form>

      <p className="text-[10px] text-white/30 text-center mt-6 leading-relaxed">
        After signing up you'll add your own Gemini API key in Settings.
        <br />
        Get one at <span className="text-white/50">aistudio.google.com/apikey</span>.
      </p>
    </div>
  );
}

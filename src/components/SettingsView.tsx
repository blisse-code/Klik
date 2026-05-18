import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Coffee, Eye, EyeOff, Home, Loader2, LogOut, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchProfile, upsertProfile } from '../lib/auth';
import { DEFAULT_MODEL, MODELS, ModelKey } from '../lib/models';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  userId: string;
  email: string;
  onBack: () => void;
  onSaved: () => void;
}

export function SettingsView({ userId, email, onBack, onSaved }: SettingsViewProps) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<ModelKey>(DEFAULT_MODEL);
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profile = await fetchProfile(userId);
        if (!active) return;
        setApiKey(profile?.gemini_api_key ?? '');
        if (profile?.preferred_model && profile.preferred_model in MODELS) {
          setModel(profile.preferred_model as ModelKey);
        }
      } catch (err: any) {
        setError(err.message ?? 'Could not load your profile.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertProfile(userId, {
        gemini_api_key: apiKey.trim() || null,
        preferred_model: model,
      });
      setSavedAt(Date.now());
      onSaved();
    } catch (err: any) {
      setError(err.message ?? 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#1A1A1C] text-white">
      <div className="p-5 flex justify-between items-center border-b border-white/5 bg-[#0D0D0E]/90 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">
          Settings
        </span>
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
          aria-label="Back to landing page"
        >
          <Home className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/40 mb-1">
            Account
          </div>
          <div className="text-sm text-white/80">{email}</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          </div>
        ) : (
          <form onSubmit={save} className="space-y-5">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-white/40 mb-2 block">
                Gemini API key
              </label>
              <div className="relative">
                <input
                  type={reveal ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-3 pr-10 bg-black/40 border border-white/10 rounded-lg text-sm font-mono placeholder-white/30 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white"
                >
                  {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                Stored encrypted in your row in Supabase. Get a key at{' '}
                <span className="text-white/60">aistudio.google.com/apikey</span>.
              </p>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-widest text-white/40 mb-2 block">
                Default model
              </label>
              <div className="space-y-2">
                {(Object.keys(MODELS) as ModelKey[]).map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setModel(k)}
                    className={cn(
                      'w-full text-left px-3 py-3 rounded-lg border transition-colors',
                      model === k
                        ? 'bg-blue-600/15 border-blue-500/60'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{MODELS[k].label}</div>
                      <span
                        className={cn(
                          'text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                          MODELS[k].tier === 'free'
                            ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                            : 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                        )}
                      >
                        {MODELS[k].tier === 'free' ? 'Free' : 'Paid'}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/50 mt-0.5">
                      {MODELS[k].description}
                    </div>
                    <div className="text-[9px] text-white/30 font-mono mt-1">
                      {MODELS[k].id}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {savedAt && !error && (
              <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
                Saved.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE</span>
                </>
              )}
            </button>
          </form>
        )}

        <a
          href="https://buymeacoffee.com/blisse.code"
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/30 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center space-x-2 hover:from-amber-500/25 hover:to-yellow-500/25 text-amber-200 transition-colors"
        >
          <Coffee className="w-4 h-4" />
          <span>BUY ME A COFFEE</span>
        </a>

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center space-x-2 hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>SIGN OUT</span>
        </button>
      </div>
    </div>
  );
}

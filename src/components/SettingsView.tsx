import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Coffee,
  Eye,
  EyeOff,
  Home,
  Loader2,
  LogOut,
  Save,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchProfile, upsertProfile } from '../lib/auth';
import {
  DEFAULT_PROVIDER_ORDER,
  PROVIDERS,
  type ProviderId,
  type ProviderKeys,
} from '../lib/providers';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  userId: string;
  email: string;
  onBack: () => void;
  onSaved: () => void;
}

const KIND_BADGE: Record<string, string> = {
  foundation: 'text-blue-200 border-blue-400/50 bg-blue-500/15',
  'open-source': 'text-emerald-200 border-emerald-400/50 bg-emerald-500/15',
  local: 'text-amber-200 border-amber-400/50 bg-amber-500/15',
};

export function SettingsView({ userId, email, onBack, onSaved }: SettingsViewProps) {
  const [keys, setKeys] = useState<ProviderKeys>({});
  const [order, setOrder] = useState<ProviderId[]>(DEFAULT_PROVIDER_ORDER);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
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
        if (profile) {
          setKeys(profile.provider_keys);
          setOrder(profile.provider_order.length ? profile.provider_order : DEFAULT_PROVIDER_ORDER);
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

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const setKey = (id: ProviderId, value: string) =>
    setKeys((prev) => ({ ...prev, [id]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const cleaned: ProviderKeys = {};
      for (const id of Object.keys(keys) as ProviderId[]) {
        const v = keys[id]?.trim();
        if (v) cleaned[id] = v;
      }
      await upsertProfile(userId, { provider_keys: cleaned, provider_order: order });
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
      <div className="p-5 flex justify-between items-center border-b border-white/10 bg-[#0D0D0E]/95 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center border border-white/15 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors"
          aria-label="Back to camera"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
        </button>
        <h1 className="text-[10px] uppercase font-bold tracking-widest text-white/95">
          Settings
        </h1>
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center border border-white/15 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors"
          aria-label="Back to landing page"
        >
          <Home className="w-4 h-4" aria-hidden />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/65 mb-1">
            Account
          </div>
          <div className="text-sm text-white/95">{email}</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
            <Loader2 className="w-5 h-5 animate-spin text-white/70" aria-hidden />
            <span className="sr-only">Loading profile</span>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-5">
            <fieldset>
              <div className="flex items-baseline justify-between mb-2">
                <legend className="text-[10px] uppercase tracking-widest text-white/65">
                  AI Providers
                </legend>
                <span className="text-[10px] text-white/60">Tried top → bottom</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed mb-3">
                Each provider is tried in order. If one fails (no key, quota, network),
                the chain falls through to the next. The local pipeline at the bottom
                always works — no key required.
              </p>

              <div className="space-y-2">
                {order.map((id, index) => {
                  const meta = PROVIDERS[id];
                  if (!meta) return null;
                  const keyId = `provider-key-${id}`;
                  return (
                    <div
                      key={id}
                      className="bg-black/50 border border-white/15 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            className="w-6 h-5 rounded bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label={`Move ${meta.label} up`}
                          >
                            <ArrowUp className="w-3 h-3" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, 1)}
                            disabled={index === order.length - 1}
                            className="w-6 h-5 rounded bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label={`Move ${meta.label} down`}
                          >
                            <ArrowDown className="w-3 h-3" aria-hidden />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">
                              {meta.label}
                            </span>
                            <span
                              className={cn(
                                'text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                                KIND_BADGE[meta.kind]
                              )}
                            >
                              {meta.kind === 'open-source' ? 'OSS' : meta.kind}
                            </span>
                          </div>
                          {meta.note && (
                            <p className="text-[10px] text-white/65 mt-0.5 leading-snug">
                              {meta.note}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-white/60 font-mono" aria-label={`Position ${index + 1}`}>
                          #{index + 1}
                        </span>
                      </div>

                      {meta.needsKey && (
                        <div>
                          <label htmlFor={keyId} className="sr-only">
                            {meta.label} API key
                          </label>
                          <div className="relative">
                            <input
                              id={keyId}
                              type={reveal[id] ? 'text' : 'password'}
                              value={keys[id] ?? ''}
                              onChange={(e) => setKey(id, e.target.value)}
                              placeholder={meta.keyPlaceholder ?? ''}
                              className="w-full px-3 py-2 pr-10 bg-black/70 border border-white/15 rounded-md text-xs font-mono placeholder-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400"
                              autoComplete="off"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setReveal((r) => ({ ...r, [id]: !r[id] }))
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                              aria-label={reveal[id] ? `Hide ${meta.label} key` : `Show ${meta.label} key`}
                              aria-pressed={!!reveal[id]}
                            >
                              {reveal[id] ? (
                                <EyeOff className="w-3.5 h-3.5" aria-hidden />
                              ) : (
                                <Eye className="w-3.5 h-3.5" aria-hidden />
                              )}
                            </button>
                          </div>
                          {meta.keyHelp && (
                            <p className="text-[11px] text-white/70 mt-1.5 leading-snug">
                              {meta.keyHelp}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {error && (
              <p
                className="text-xs text-red-200 bg-red-500/20 border border-red-400/40 rounded-md px-3 py-2"
                role="alert"
              >
                {error}
              </p>
            )}
            {savedAt && !error && (
              <p
                className="text-xs text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 rounded-md px-3 py-2"
                role="status"
                aria-live="polite"
              >
                Saved.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1C]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden />
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
          className="w-full py-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center space-x-2 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1C]"
        >
          <Coffee className="w-4 h-4" aria-hidden />
          <span>BUY ME A COFFEE</span>
        </a>

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="w-full py-3 bg-white/8 border border-white/15 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center space-x-2 hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1C]"
        >
          <LogOut className="w-4 h-4" aria-hidden />
          <span>SIGN OUT</span>
        </button>
      </div>
    </div>
  );
}

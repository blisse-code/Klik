import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { ProviderId, ProviderKeys } from './providers';
import { DEFAULT_PROVIDER_ORDER } from './providers';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export interface Profile {
  id: string;
  provider_keys: ProviderKeys;
  provider_order: ProviderId[];
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, provider_keys, provider_order')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    provider_keys: (data.provider_keys ?? {}) as ProviderKeys,
    provider_order:
      (data.provider_order as ProviderId[] | null) ?? DEFAULT_PROVIDER_ORDER,
  };
}

export async function upsertProfile(
  userId: string,
  patch: { provider_keys?: ProviderKeys; provider_order?: ProviderId[] }
) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch }, { onConflict: 'id' });
  if (error) throw error;
}

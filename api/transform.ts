import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { ADAPTERS, ProviderError, type ProviderId } from './providers.js';

const SERVER_PROVIDER_IDS: ProviderId[] = ['gemini', 'openai', 'xai', 'fal'];
function isServerProvider(id: string): id is ProviderId {
  return (SERVER_PROVIDER_IDS as string[]).includes(id);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } },
  maxDuration: 60,
};

function buildPromptFromParams(p: any): string {
  return `Transform the uploaded photo into a ${p?.mode || 'photorealistic'} image with a ${p?.aesthetic || 'natural'} look. Apply ${p?.colourGrade || 'natural'} colour grading, simulate a ${p?.cameraType || 'natural'} camera, add ${p?.filterTexture || 'clean'} texture, and change the ambience to ${p?.ambience || 'original'}. Preserve the original subject identity, pose, composition, clothing structure, facial details, object placement, and image quality. Maintain high sharpness, natural lighting coherence, realistic depth, and clean detail. Avoid artifacts, distortion, extra limbs, warped facial features, unreadable text, or excessive stylization unless explicitly selected.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server is not configured for Supabase.' });
    }

    const authHeader = (req.headers.authorization as string | undefined) ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing auth token. Please sign in.' });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
    const userId = userData.user.id;

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('provider_keys, provider_order')
      .eq('id', userId)
      .maybeSingle();
    if (profileErr) {
      return res.status(500).json({ error: 'Could not load your profile.' });
    }

    const providerKeys = (profile?.provider_keys ?? {}) as Record<string, string>;
    const providerOrder = (profile?.provider_order ?? []) as string[];

    const { imageParams, base64ImageContext } = req.body ?? {};
    const match =
      typeof base64ImageContext === 'string'
        ? base64ImageContext.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/)
        : null;
    if (!match) {
      return res.status(400).json({ error: 'Invalid base64 image format.' });
    }
    const mimeType = match[1];
    const imageBase64 = match[2];
    const prompt = buildPromptFromParams(imageParams);

    // Walk the chain. Skip non-server providers (e.g. 'local') and any
    // provider missing a key. First adapter that succeeds wins.
    const attempts: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const id of providerOrder) {
      if (!isServerProvider(id)) continue;
      const apiKey = providerKeys[id];
      if (!apiKey) {
        attempts.push({ id, ok: false, error: 'no key configured' });
        continue;
      }
      try {
        const adapter = ADAPTERS[id];
        const out = await adapter({ imageBase64, mimeType, prompt, apiKey });
        attempts.push({ id, ok: true });
        return res.json({
          imageUrl: `data:${out.mimeType};base64,${out.imageBase64}`,
          prompt,
          provider: id,
          attempts,
        });
      } catch (err: any) {
        const msg = err?.message || String(err);
        attempts.push({ id, ok: false, error: msg });
        if (err instanceof ProviderError && !err.retryable) {
          // Bad-request style error — all providers would fail. Stop now.
          return res.status(err.status >= 400 && err.status < 600 ? err.status : 500).json({
            error: msg,
            attempts,
          });
        }
      }
    }

    // No server provider succeeded. Tell the client so it can fall back to
    // the local WebGL filter pipeline if 'local' is in the chain.
    const hasLocal = providerOrder.includes('local');
    return res.status(hasLocal ? 200 : 502).json({
      error: 'No AI provider succeeded.',
      shouldFallbackLocal: hasLocal,
      attempts,
    });
  } catch (error: any) {
    console.error('Chain executor error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to transform image' });
  }
}

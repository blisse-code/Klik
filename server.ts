import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { ADAPTERS, ProviderError, type ProviderId } from './api/providers';

const SERVER_PROVIDER_IDS: ProviderId[] = ['gemini', 'openai', 'xai', 'fal'];
function isServerProvider(id: string): id is ProviderId {
  return (SERVER_PROVIDER_IDS as string[]).includes(id);
}

function buildPromptFromParams(p: any): string {
  return `Transform the uploaded photo into a ${p?.mode || 'photorealistic'} image with a ${p?.aesthetic || 'natural'} look. Apply ${p?.colourGrade || 'natural'} colour grading, simulate a ${p?.cameraType || 'natural'} camera, add ${p?.filterTexture || 'clean'} texture, and change the ambience to ${p?.ambience || 'original'}. Preserve the original subject identity, pose, composition, clothing structure, facial details, object placement, and image quality. Maintain high sharpness, natural lighting coherence, realistic depth, and clean detail. Avoid artifacts, distortion, extra limbs, warped facial features, unreadable text, or excessive stylization unless explicitly selected.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      'WARNING: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for /api/transform to work.'
    );
  }

  const supabaseAdmin =
    SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  app.post('/api/transform', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server is not configured for Supabase.' });
      }

      const authHeader = req.headers.authorization ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        return res.status(401).json({ error: 'Missing auth token. Please sign in.' });
      }

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
      const match = base64ImageContext?.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid base64 image format.' });
      }
      const mimeType = match[1];
      const imageBase64 = match[2];
      const prompt = buildPromptFromParams(imageParams);

      const attempts: Array<{ id: string; ok: boolean; error?: string }> = [];
      for (const id of providerOrder) {
        if (!isServerProvider(id)) continue;
        const apiKey = providerKeys[id];
        if (!apiKey) {
          attempts.push({ id, ok: false, error: 'no key configured' });
          continue;
        }
        try {
          const out = await ADAPTERS[id]({ imageBase64, mimeType, prompt, apiKey });
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
            return res
              .status(err.status >= 400 && err.status < 600 ? err.status : 500)
              .json({ error: msg, attempts });
          }
        }
      }

      const hasLocal = providerOrder.includes('local');
      return res.status(hasLocal ? 200 : 502).json({
        error: 'No AI provider succeeded.',
        shouldFallbackLocal: hasLocal,
        attempts,
      });
    } catch (error: any) {
      console.error('Chain executor error:', error);
      return res.status(500).json({ error: error.message || 'Failed to transform image' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Klik server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

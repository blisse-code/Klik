import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { resolveModelId } from '../src/lib/models';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' },
  },
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabaseAdmin) {
      return res
        .status(500)
        .json({ error: 'Server is not configured for Supabase.' });
    }

    const authHeader = (req.headers.authorization as string | undefined) ?? '';
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
      .select('gemini_api_key, preferred_model')
      .eq('id', userId)
      .maybeSingle();
    if (profileErr) {
      return res.status(500).json({ error: 'Could not load your profile.' });
    }
    const apiKey = profile?.gemini_api_key;
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: 'No Gemini API key on file. Add one in Settings.' });
    }

    const { imageParams, base64ImageContext, model } = req.body ?? {};
    const {
      mode,
      aesthetic,
      colourGrade,
      cameraType,
      filterTexture,
      ambience,
    } = imageParams ?? {};

    const match =
      typeof base64ImageContext === 'string'
        ? base64ImageContext.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/)
        : null;
    if (!match) {
      return res.status(400).json({ error: 'Invalid base64 image format.' });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const modelId = resolveModelId(model ?? profile?.preferred_model ?? undefined);

    const ai = new GoogleGenAI({ apiKey });

    const fullPrompt = `Transform the uploaded photo into a ${mode || 'photorealistic'} image with a ${aesthetic || 'natural'} look. Apply ${colourGrade || 'natural'} colour grading, simulate a ${cameraType || 'natural'} camera, add ${filterTexture || 'clean'} texture, and change the ambience to ${ambience || 'original'}. Preserve the original subject identity, pose, composition, clothing structure, facial details, object placement, and image quality. Maintain high sharpness, natural lighting coherence, realistic depth, and clean detail. Avoid artifacts, distortion, extra limbs, warped facial features, unreadable text, or excessive stylization unless explicitly selected.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: fullPrompt },
        ],
      },
    });

    let generatedImageUrl: string | null = null;
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (generatedImageUrl) {
      return res.json({
        imageUrl: generatedImageUrl,
        prompt: fullPrompt,
        model: modelId,
      });
    }

    console.error('No image returned from Gemini', response);
    return res.status(500).json({ error: 'No image received from AI model.' });
  } catch (error: any) {
    console.error('Error transforming image:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to transform image' });
  }
}

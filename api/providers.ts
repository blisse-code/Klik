// Provider adapters for /api/transform. Bundled into the serverless
// function — no cross-folder imports outside /api (those would
// ERR_MODULE_NOT_FOUND at runtime on Vercel).
import { GoogleGenAI } from '@google/genai';

export type ProviderId = 'gemini' | 'openai' | 'xai' | 'fal';

export interface TransformInput {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  apiKey: string;
}

export interface TransformOutput {
  imageBase64: string;
  mimeType: string;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean
  ) {
    super(message);
  }
}

// Map raw HTTP errors to ProviderError. Status families:
//   401/403 → auth error, retryable (try next provider's key)
//   404     → resource not found (often: model ID changed), retryable
//   429     → quota, retryable
//   5xx     → server, retryable
//   other 4xx → bad request, NOT retryable
function classifyHttpError(status: number, body: string): ProviderError {
  const retryable =
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 429 ||
    status >= 500;
  return new ProviderError(`HTTP ${status}: ${body.slice(0, 300)}`, status, retryable);
}

// ----- Gemini --------------------------------------------------------------

// Multiple candidate IDs in case Google renames. The Nano Banana family went
// from `-preview` to GA, and `imagen-3` lives on the same SDK. Walk in order,
// retry on 404/429/5xx (which means "this candidate didn't work, try next").
const GEMINI_MODELS = [
  'gemini-2.5-flash-image',          // current GA name (Nano Banana)
  'gemini-2.5-flash-image-preview',  // legacy preview alias
  'gemini-3-pro-image-preview',      // paid, higher fidelity
  'imagen-3.0-generate-002',          // Imagen 3 fallback
];

async function transformGemini(input: TransformInput): Promise<TransformOutput> {
  const ai = new GoogleGenAI({ apiKey: input.apiKey });
  let lastErr: ProviderError | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: input.imageBase64, mimeType: input.mimeType } },
            { text: input.prompt },
          ],
        },
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return {
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
      }
      // Model responded successfully but didn't include an image part — keep
      // trying other models since this one may not support image output.
      lastErr = new ProviderError(`Gemini ${model}: no image part in response`, 502, true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      const m = msg.match(/\b(\d{3})\b/);
      const status = m ? Number(m[1]) : 500;
      // Retry on 404 (model gone/renamed), 429 (quota), 5xx (server). Stop
      // on 401/403 because re-trying with the same key against a different
      // model name won't help auth.
      const retryWithinAdapter = status === 404 || status === 429 || status >= 500;
      lastErr = new ProviderError(`Gemini ${model}: ${msg}`, status, true);
      if (!retryWithinAdapter) break;
    }
  }
  throw lastErr ?? new ProviderError('Gemini failed', 500, true);
}

// ----- OpenAI --------------------------------------------------------------
// gpt-image-1 is the current image-edit model. It requires *organization
// identity verification* (gov-ID) before access is granted. Users with a
// valid API key but no verification hit 401 "must be verified" — give them
// a clear, actionable message instead of raw JSON.

function rewriteOpenAIError(status: number, body: string): ProviderError {
  // Try to surface the most useful message. OpenAI returns
  // {"error":{"message":"...","code":"...","type":"..."}}
  let inner = body;
  try {
    const j = JSON.parse(body);
    inner = j?.error?.message ?? body;
  } catch {
    /* fall through */
  }

  const lower = inner.toLowerCase();
  if (
    status === 401 &&
    (lower.includes('must be verified') ||
      lower.includes('insufficient permissions') ||
      lower.includes('organization must be verified') ||
      lower.includes('not verified'))
  ) {
    return new ProviderError(
      'OpenAI org not verified for gpt-image-1. Verify at platform.openai.com/settings/organization/general, then retry.',
      status,
      true
    );
  }
  if (status === 401) {
    return new ProviderError(
      `OpenAI auth failed: ${inner.slice(0, 200)}`,
      status,
      true
    );
  }
  return classifyHttpError(status, inner);
}

async function transformOpenAI(input: TransformInput): Promise<TransformOutput> {
  // /v1/images/edits accepts multipart with PNG. gpt-image-1 supports image input.
  const imageBuffer = Buffer.from(input.imageBase64, 'base64');
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', input.prompt);
  form.append('size', '1024x1024');
  form.append(
    'image',
    new Blob([new Uint8Array(imageBuffer)], { type: input.mimeType }),
    'input.png'
  );

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw rewriteOpenAIError(res.status, text);
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new ProviderError('OpenAI returned no b64_json', 502, true);
  return { imageBase64: b64, mimeType: 'image/png' };
}

// ----- xAI Grok ------------------------------------------------------------
// grok-2-image is text-to-image only. We feed the prompt without the photo —
// users selecting this in the chain accept a degraded mode.
async function transformXAI(input: TransformInput): Promise<TransformOutput> {
  const res = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-image',
      prompt: input.prompt,
      response_format: 'b64_json',
      n: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw classifyHttpError(res.status, text);
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new ProviderError('xAI returned no b64_json', 502, true);
  return { imageBase64: b64, mimeType: 'image/png' };
}

// ----- fal.ai Flux ---------------------------------------------------------

async function transformFal(input: TransformInput): Promise<TransformOutput> {
  // fal.ai sync endpoint. flux/dev/image-to-image accepts a data URL.
  const dataUrl = `data:${input.mimeType};base64,${input.imageBase64}`;
  const res = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${input.apiKey}`,
    },
    body: JSON.stringify({
      image_url: dataUrl,
      prompt: input.prompt,
      strength: 0.85,
      num_inference_steps: 28,
      num_images: 1,
      output_format: 'png',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw classifyHttpError(res.status, text);
  }
  const json = (await res.json()) as { images?: Array<{ url?: string }> };
  const url = json.images?.[0]?.url;
  if (!url) throw new ProviderError('fal returned no image url', 502, true);

  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new ProviderError('fal image fetch failed', imgRes.status, true);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const mimeType = imgRes.headers.get('content-type') || 'image/png';
  return { imageBase64: buf.toString('base64'), mimeType };
}

// ----- Dispatcher ----------------------------------------------------------

export const ADAPTERS: Record<ProviderId, (i: TransformInput) => Promise<TransformOutput>> = {
  gemini: transformGemini,
  openai: transformOpenAI,
  xai: transformXAI,
  fal: transformFal,
};

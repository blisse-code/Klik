export type ProviderId = 'gemini' | 'openai' | 'xai' | 'fal' | 'local';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  kind: 'foundation' | 'open-source' | 'local';
  needsKey: boolean;
  keyPlaceholder?: string;
  keyHelp?: string;
  capability: 'image-to-image' | 'text-to-image' | 'filter-only';
  note?: string;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    kind: 'foundation',
    needsKey: true,
    keyPlaceholder: 'AIza...',
    keyHelp: 'Get a key at aistudio.google.com/apikey. Free tier covers Nano Banana.',
    capability: 'image-to-image',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI (gpt-image-1)',
    kind: 'foundation',
    needsKey: true,
    keyPlaceholder: 'sk-...',
    keyHelp: 'Get a key at platform.openai.com/api-keys. Paid tier only.',
    capability: 'image-to-image',
  },
  xai: {
    id: 'xai',
    label: 'xAI Grok (grok-2-image)',
    kind: 'foundation',
    needsKey: true,
    keyPlaceholder: 'xai-...',
    keyHelp: 'Get a key at console.x.ai. Text-to-image — input photo is described, not edited.',
    capability: 'text-to-image',
    note: 'Falls back to text-to-image. The captured photo informs the prompt but is not directly transformed.',
  },
  fal: {
    id: 'fal',
    label: 'fal.ai (Flux)',
    kind: 'open-source',
    needsKey: true,
    keyPlaceholder: 'fal_...',
    keyHelp: 'Get a key at fal.ai/dashboard/keys. Open-source Flux models, pay per second.',
    capability: 'image-to-image',
  },
  local: {
    id: 'local',
    label: 'Local filter pipeline',
    kind: 'local',
    needsKey: false,
    capability: 'filter-only',
    note: 'WebGL filter chain that runs in the browser. No API key, no network call, no AI — just colour grading, grain, vignette, and frame overlays. Always available.',
  },
};

export const DEFAULT_PROVIDER_ORDER: ProviderId[] = [
  'gemini',
  'openai',
  'xai',
  'fal',
  'local',
];

export type ProviderKeys = Partial<Record<ProviderId, string>>;

export interface ImageParams {
  mode: string;
  aesthetic: string;
  colourGrade: string;
  cameraType: string;
  resolutionLabel: string;
  filterTexture: string;
  ambience: string;
}

export function buildPrompt(p: ImageParams): string {
  return `Transform the uploaded photo into a ${p.mode || 'photorealistic'} image with a ${p.aesthetic || 'natural'} look. Apply ${p.colourGrade || 'natural'} colour grading, simulate a ${p.cameraType || 'natural'} camera, add ${p.filterTexture || 'clean'} texture, and change the ambience to ${p.ambience || 'original'}. Preserve the original subject identity, pose, composition, clothing structure, facial details, object placement, and image quality. Maintain high sharpness, natural lighting coherence, realistic depth, and clean detail. Avoid artifacts, distortion, extra limbs, warped facial features, unreadable text, or excessive stylization unless explicitly selected.`;
}

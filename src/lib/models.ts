export type ModelKey = 'nano-banana-free' | 'nano-banana-2' | 'gemini-3.1-pro';

export interface ModelEntry {
  id: string;
  label: string;
  description: string;
  tier: 'free' | 'paid';
}

export const MODELS: Record<ModelKey, ModelEntry> = {
  'nano-banana-free': {
    id: 'gemini-2.5-flash-image-preview',
    label: 'Nano Banana (Free)',
    description: "Google's free-tier image model. Works without billing.",
    tier: 'free',
  },
  'nano-banana-2': {
    id: 'gemini-3-pro-image-preview',
    label: 'Nano Banana 2',
    description: 'Paid tier. Fast, vivid, strong subject preservation.',
    tier: 'paid',
  },
  'gemini-3.1-pro': {
    id: 'gemini-3-pro-preview',
    label: 'Gemini 3.1 Pro',
    description: 'Paid tier. Higher fidelity, better at fine detail and text.',
    tier: 'paid',
  },
};

export const DEFAULT_MODEL: ModelKey = 'nano-banana-free';

export function resolveModelId(key: string | undefined): string {
  const entry = MODELS[(key as ModelKey) ?? DEFAULT_MODEL] ?? MODELS[DEFAULT_MODEL];
  return entry.id;
}

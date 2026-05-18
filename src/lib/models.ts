export type ModelKey = 'nano-banana-2' | 'gemini-3.1-pro';

export interface ModelEntry {
  id: string;
  label: string;
  description: string;
}

export const MODELS: Record<ModelKey, ModelEntry> = {
  'nano-banana-2': {
    id: 'gemini-3-pro-image-preview',
    label: 'Nano Banana 2',
    description: 'Default image model. Fast, vivid, strong subject preservation.',
  },
  'gemini-3.1-pro': {
    id: 'gemini-3-pro-preview',
    label: 'Gemini 3.1 Pro',
    description: 'Slower, higher fidelity, better at fine detail and text.',
  },
};

export const DEFAULT_MODEL: ModelKey = 'nano-banana-2';

export function resolveModelId(key: string | undefined): string {
  const entry = MODELS[(key as ModelKey) ?? DEFAULT_MODEL] ?? MODELS[DEFAULT_MODEL];
  return entry.id;
}

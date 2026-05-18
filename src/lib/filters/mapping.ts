// Maps ImageParams selections to numeric shader uniforms. Each lookup is
// intentionally a flat table — adding a new option is one line, and the
// behaviour stays readable instead of being scattered across conditionals.

import type { ImageParams } from '../providers';

export interface ToneSettings {
  exposure: number;
  contrast: number;
  saturation: number;
  tintShadow: [number, number, number];
  tintHighlight: [number, number, number];
  tintAmount: number;
  temperature: number;
  tintGreenMagenta: number;
  monoMix: number;
}

export interface TextureSettings {
  vignette: number;
  grain: number;
  halation: number;
}

export interface FrameOverlay {
  kind: 'none' | 'polaroid' | 'film35mm' | 'disposable';
}

const NEUTRAL: ToneSettings = {
  exposure: 0,
  contrast: 1.0,
  saturation: 1.0,
  tintShadow: [0, 0, 0],
  tintHighlight: [1, 1, 1],
  tintAmount: 0,
  temperature: 0,
  tintGreenMagenta: 0,
  monoMix: 0,
};

const COLOUR_GRADES: Record<string, Partial<ToneSettings>> = {
  Natural: {},
  Warm: { temperature: 0.4, saturation: 1.1 },
  Cool: { temperature: -0.45, saturation: 1.05 },
  'Teal and orange': {
    tintShadow: [0.0, 0.55, 0.7],
    tintHighlight: [1.0, 0.6, 0.25],
    tintAmount: 0.45,
    contrast: 1.15,
    saturation: 1.15,
  },
  'High contrast': { contrast: 1.35, saturation: 1.05 },
  Pastel: { contrast: 0.85, saturation: 0.85, exposure: 0.15 },
  'Vintage film': {
    tintShadow: [0.3, 0.18, 0.0],
    tintHighlight: [1.0, 0.92, 0.75],
    tintAmount: 0.4,
    contrast: 0.95,
    saturation: 0.85,
    temperature: 0.2,
  },
  Monochrome: { monoMix: 1.0, contrast: 1.2 },
  'Cyberpunk neon': {
    tintShadow: [0.55, 0.0, 0.85],
    tintHighlight: [0.0, 1.0, 0.95],
    tintAmount: 0.55,
    saturation: 1.4,
    contrast: 1.2,
  },
};

const AMBIENCE: Record<string, Partial<ToneSettings>> = {
  'Original scene': {},
  'Golden hour': {
    temperature: 0.55,
    tintHighlight: [1.0, 0.85, 0.55],
    tintAmount: 0.35,
    exposure: 0.1,
  },
  'Rainy night': {
    temperature: -0.4,
    tintShadow: [0.05, 0.15, 0.35],
    tintAmount: 0.45,
    exposure: -0.25,
    contrast: 1.1,
  },
  'Neon city': {
    saturation: 1.4,
    tintShadow: [0.45, 0.0, 0.8],
    tintHighlight: [0.2, 0.85, 1.0],
    tintAmount: 0.5,
  },
  'Luxury studio': { exposure: 0.15, contrast: 1.1, saturation: 1.05 },
  'Snowy landscape': {
    temperature: -0.25,
    exposure: 0.2,
    contrast: 0.95,
    saturation: 0.85,
  },
  'Tokyo street at night': {
    saturation: 1.3,
    tintShadow: [0.2, 0.0, 0.45],
    tintHighlight: [1.0, 0.4, 0.45],
    tintAmount: 0.5,
    exposure: -0.15,
  },
  'Dreamlike fantasy': {
    saturation: 1.15,
    tintHighlight: [0.95, 0.8, 1.0],
    tintAmount: 0.3,
    exposure: 0.1,
  },
};

const AESTHETIC: Record<string, Partial<ToneSettings & TextureSettings>> = {
  'Natural lifestyle': {},
  Cinematic: { contrast: 1.15, vignette: 0.45 },
  'Fashion campaign': { contrast: 1.2, saturation: 1.1, vignette: 0.25 },
  'Editorial magazine': { contrast: 1.25, vignette: 0.3 },
  'Street photography': { contrast: 1.15, grain: 0.12 },
  'Fine art portrait': { contrast: 1.1, vignette: 0.4, saturation: 0.95 },
  Dreamlike: { contrast: 0.9, saturation: 1.05, halation: 0.25 },
  Moody: { exposure: -0.2, contrast: 1.2, vignette: 0.55 },
};

const FILTER_TEXTURE: Record<string, Partial<TextureSettings>> = {
  Clean: {},
  Gritty: { grain: 0.18, vignette: 0.35 },
  Grainy: { grain: 0.2 },
  'Soft glow': { halation: 0.35 },
  Matte: {},
  'Film grain': { grain: 0.15 },
  Halation: { halation: 0.45 },
  'Dramatic shadows': { vignette: 0.55 },
};

const CAMERA_FRAME: Record<string, FrameOverlay['kind']> = {
  'iPhone natural camera': 'none',
  DSLR: 'none',
  '35mm film camera': 'film35mm',
  Polaroid: 'polaroid',
  'Disposable camera': 'disposable',
  'Cinematic anamorphic lens': 'none',
  'Macro lens': 'none',
};

const CAMERA_TONE: Record<string, Partial<ToneSettings & TextureSettings>> = {
  'iPhone natural camera': {},
  DSLR: { contrast: 1.05 },
  '35mm film camera': { grain: 0.12, contrast: 1.05, saturation: 0.95 },
  Polaroid: { contrast: 0.9, saturation: 0.9, exposure: 0.1, vignette: 0.2 },
  'Disposable camera': { grain: 0.16, saturation: 1.1, contrast: 1.1 },
  'Cinematic anamorphic lens': { contrast: 1.15, vignette: 0.5 },
  'Macro lens': {},
};

function merge(...layers: Partial<ToneSettings & TextureSettings>[]): ToneSettings & TextureSettings {
  const result = { ...NEUTRAL, vignette: 0, grain: 0, halation: 0 } as ToneSettings & TextureSettings;
  for (const layer of layers) {
    for (const k of Object.keys(layer) as Array<keyof typeof layer>) {
      const v = layer[k];
      if (v === undefined) continue;
      (result as any)[k] = v;
    }
  }
  return result;
}

export function paramsToSettings(p: ImageParams): {
  tone: ToneSettings;
  texture: TextureSettings;
  frame: FrameOverlay;
} {
  const combined = merge(
    COLOUR_GRADES[p.colourGrade] ?? {},
    AMBIENCE[p.ambience] ?? {},
    AESTHETIC[p.aesthetic] ?? {},
    FILTER_TEXTURE[p.filterTexture] ?? {},
    CAMERA_TONE[p.cameraType] ?? {}
  );
  const tone: ToneSettings = {
    exposure: combined.exposure,
    contrast: combined.contrast,
    saturation: combined.saturation,
    tintShadow: combined.tintShadow,
    tintHighlight: combined.tintHighlight,
    tintAmount: combined.tintAmount,
    temperature: combined.temperature,
    tintGreenMagenta: combined.tintGreenMagenta,
    monoMix: combined.monoMix,
  };
  const texture: TextureSettings = {
    vignette: combined.vignette,
    grain: combined.grain,
    halation: combined.halation,
  };
  return { tone, texture, frame: { kind: CAMERA_FRAME[p.cameraType] ?? 'none' } };
}

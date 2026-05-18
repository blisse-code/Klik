import React, { useMemo, useState } from 'react';
import { ArrowLeft, Eye, Sparkles, Wand2, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  PROVIDERS,
  type ImageParams,
  type ProviderId,
  type ProviderKeys,
} from '../lib/providers';

export type GenerationMode = 'filters' | 'ai';

interface EditorViewProps {
  image: string;
  providerOrder: ProviderId[];
  providerKeys: ProviderKeys;
  onBack: () => void;
  onGenerate: (params: ImageParams, mode: GenerationMode) => void;
}

const PARAM_OPTIONS = {
  mode: ['Photorealistic', 'Hyperrealistic', 'Anime', 'Manga', '3D render', 'Oil painting', 'Cyberpunk illustration', 'Graphic novel'],
  aesthetic: ['Natural lifestyle', 'Cinematic', 'Fashion campaign', 'Editorial magazine', 'Street photography', 'Fine art portrait', 'Dreamlike', 'Moody'],
  colourGrade: ['Natural', 'Warm', 'Cool', 'Teal and orange', 'High contrast', 'Pastel', 'Vintage film', 'Monochrome', 'Cyberpunk neon'],
  cameraType: ['iPhone natural camera', 'DSLR', '35mm film camera', 'Polaroid', 'Disposable camera', 'Cinematic anamorphic lens', 'Macro lens'],
  filterTexture: ['Clean', 'Gritty', 'Grainy', 'Soft glow', 'Matte', 'Film grain', 'Halation', 'Dramatic shadows'],
  ambience: ['Original scene', 'Golden hour', 'Rainy night', 'Neon city', 'Luxury studio', 'Snowy landscape', 'Tokyo street at night', 'Dreamlike fantasy'],
  resolutionLabel: ['Standard', 'HD', '4K', 'Ultra-detailed 4K render'],
};

type ParamKey = keyof ImageParams;

const PARAM_LABELS: Record<ParamKey, string> = {
  mode: 'Style Mode',
  aesthetic: 'Aesthetic',
  colourGrade: 'Color Grade',
  cameraType: 'Camera',
  filterTexture: 'Texture',
  ambience: 'Ambience',
  resolutionLabel: 'Resolution',
};

// In filter mode some axes are no-ops (the WebGL pipeline can't render
// "Anime" or "Oil painting" — those are AI-style transforms). We hide
// them so users don't think they're picking something that will apply.
const FILTER_MODE_TABS: ParamKey[] = [
  'colourGrade',
  'aesthetic',
  'cameraType',
  'filterTexture',
  'ambience',
];

export function EditorView({
  image,
  providerOrder,
  providerKeys,
  onBack,
  onGenerate,
}: EditorViewProps) {
  const [params, setParams] = useState<ImageParams>({
    mode: 'Photorealistic',
    aesthetic: 'Natural lifestyle',
    colourGrade: 'Natural',
    cameraType: 'DSLR',
    resolutionLabel: '4K',
    filterTexture: 'Clean',
    ambience: 'Original scene',
  });

  // Active AI chain — providers in order that have a key and aren't 'local'.
  const aiChain = useMemo(
    () =>
      providerOrder.filter((id) => {
        const meta = PROVIDERS[id];
        if (!meta || !meta.needsKey) return false;
        return (providerKeys[id]?.length ?? 0) > 0;
      }),
    [providerOrder, providerKeys]
  );

  const hasAiKeys = aiChain.length > 0;
  // Default to AI when keys exist, filters when they don't.
  const [mode, setMode] = useState<GenerationMode>(hasAiKeys ? 'ai' : 'filters');

  const tabsForMode = mode === 'filters' ? FILTER_MODE_TABS : (Object.keys(PARAM_LABELS) as ParamKey[]);
  const [activeTab, setActiveTab] = useState<ParamKey>('colourGrade');

  // If a user switches to filter mode while an AI-only tab was active,
  // bounce to a tab that's visible.
  React.useEffect(() => {
    if (!tabsForMode.includes(activeTab)) {
      setActiveTab(tabsForMode[0]);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateParam = (key: ParamKey, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#1A1A1C] text-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-20 bg-[#0D0D0E]/95 border-b border-white/10 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center border border-white/15 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors"
          aria-label="Back to camera"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
        </button>
        <span className="text-[10px] uppercase font-bold tracking-widest flex items-center text-white/95">
          <span
            className={cn(
              'w-2 h-2 rounded-full mr-2',
              mode === 'ai' ? 'bg-blue-400' : 'bg-amber-400'
            )}
            aria-hidden
          />
          {mode === 'ai' ? 'AI Control Engine' : 'Filter Engine'}
        </span>
        <div className="w-9" />
      </div>

      {/* Preview */}
      <div className="flex-1 relative flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 overflow-hidden p-4 mt-16 pb-[22rem]">
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          src={image}
          alt="Captured photo to be transformed"
          className="max-w-full max-h-full object-contain rounded-xl border border-white/15 shadow-2xl z-10"
        />
      </div>

      {/* Controls Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0D0D0E] border-t border-white/15 rounded-t-2xl flex flex-col max-h-[60vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        {/* Mode toggle (Basic vs Advanced) */}
        <div
          className="px-5 pt-4"
          role="radiogroup"
          aria-label="Generation mode"
        >
          <div className="flex gap-2 rounded-xl bg-black/60 p-1 border border-white/10">
            <ModeButton
              active={mode === 'filters'}
              onClick={() => setMode('filters')}
              tone="filter"
              label="Basic"
              hint="WebGL filters · Instant"
              icon={<Eye className="h-3.5 w-3.5" aria-hidden />}
            />
            <ModeButton
              active={mode === 'ai'}
              onClick={() => {
                if (!hasAiKeys) return;
                setMode('ai');
              }}
              tone="ai"
              label="Advanced"
              hint={hasAiKeys ? `${aiChain.length} provider${aiChain.length > 1 ? 's' : ''} · AI` : 'Add API keys in Settings'}
              icon={<Sparkles className="h-3.5 w-3.5" aria-hidden />}
              disabled={!hasAiKeys}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar px-5 pt-4 pb-0 space-x-6 border-b border-white/10" role="tablist" aria-label="Style parameters">
          {tabsForMode.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              aria-controls={`tabpanel-${key}`}
              id={`tab-${key}`}
              onClick={() => setActiveTab(key)}
              className={cn(
                'whitespace-nowrap text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm',
                activeTab === key
                  ? mode === 'ai'
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-amber-200 border-b-2 border-amber-400'
                  : 'text-white/65 hover:text-white border-b-2 border-transparent'
              )}
            >
              {PARAM_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Param chips */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${mode}-${activeTab}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-2"
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              {PARAM_OPTIONS[activeTab].map((option) => {
                const selected = params[activeTab] === option;
                return (
                  <button
                    key={option}
                    onClick={() => updateParam(activeTab, option)}
                    aria-pressed={selected}
                    className={cn(
                      'px-3 py-1.5 rounded text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                      selected
                        ? mode === 'ai'
                          ? 'bg-blue-600 border border-blue-400 text-white'
                          : 'bg-amber-600 border border-amber-400 text-white'
                        : 'bg-white/8 text-white/85 border border-transparent hover:bg-white/15'
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Provider chain (AI) or filter notice (filters) */}
        <div className="px-5 pb-3">
          {mode === 'ai' ? (
            <AiChainPanel chain={aiChain} />
          ) : (
            <FilterPanel hasAiKeys={hasAiKeys} />
          )}
        </div>

        {/* Generate button */}
        <div className="px-5 pb-safe pb-5 pt-2 bg-black/50 border-t border-white/10">
          <button
            onClick={() => onGenerate(params, mode)}
            className={cn(
              'w-full py-3.5 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center space-x-2 shadow-lg active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0E]',
              mode === 'ai'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 focus-visible:ring-blue-400'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30 focus-visible:ring-amber-400'
            )}
          >
            {mode === 'ai' ? <Wand2 className="w-4 h-4" aria-hidden /> : <Zap className="w-4 h-4" aria-hidden />}
            <span>{mode === 'ai' ? 'GENERATE WITH AI' : 'APPLY FILTERS'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModeButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone: 'ai' | 'filter';
  label: string;
  hint: string;
  icon: React.ReactNode;
}

function ModeButton({ active, disabled, onClick, tone, label, hint, icon }: ModeButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-disabled={disabled}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 rounded-lg px-3 py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2',
        active
          ? tone === 'ai'
            ? 'bg-blue-600/25 ring-1 ring-blue-400/60 focus-visible:ring-blue-400'
            : 'bg-amber-500/25 ring-1 ring-amber-400/60 focus-visible:ring-amber-400'
          : disabled
            ? 'opacity-40 cursor-not-allowed focus-visible:ring-white/30'
            : 'hover:bg-white/8 focus-visible:ring-white/40'
      )}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span
          className={cn(
            active && tone === 'ai' && 'text-blue-200',
            active && tone === 'filter' && 'text-amber-200',
            !active && 'text-white/70'
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            'text-[11px] font-bold uppercase tracking-widest',
            active && tone === 'ai' && 'text-blue-100',
            active && tone === 'filter' && 'text-amber-100',
            !active && 'text-white/85'
          )}
        >
          {label}
        </span>
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-widest text-white/65">
        {hint}
      </div>
    </button>
  );
}

function AiChainPanel({ chain }: { chain: ProviderId[] }) {
  if (chain.length === 0) {
    return null;
  }
  return (
    <div className="rounded-lg border border-blue-400/30 bg-blue-500/8 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-200">
          AI provider chain
        </span>
        <span className="text-[9px] text-white/65">Tries top → bottom, falls back on failure</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {chain.map((id, i) => (
          <React.Fragment key={id}>
            {i > 0 && (
              <span className="text-blue-300/70 text-[10px]" aria-hidden>
                ↳
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                i === 0
                  ? 'bg-blue-500/25 border-blue-300/60 text-blue-100'
                  : 'bg-white/8 border-white/15 text-white/80'
              )}
            >
              {i === 0 && <Sparkles className="h-2.5 w-2.5" aria-hidden />}
              {PROVIDERS[id]?.label ?? id}
            </span>
          </React.Fragment>
        ))}
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-500/15 border-amber-300/50 text-amber-100"
          title="Always-available fallback"
        >
          <Eye className="h-2.5 w-2.5" aria-hidden />
          Local
        </span>
      </div>
    </div>
  );
}

function FilterPanel({ hasAiKeys }: { hasAiKeys: boolean }) {
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-500/8 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Eye className="h-3 w-3 text-amber-200" aria-hidden />
        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-200">
          Basic mode · WebGL local filters
        </span>
      </div>
      <p className="text-[10px] leading-relaxed text-white/80">
        Runs instantly in your browser. No network call, no AI generation —
        colour grade, vignette, grain, and frame overlays only.
        {!hasAiKeys && ' Add a provider API key in Settings to unlock AI generation.'}
      </p>
    </div>
  );
}

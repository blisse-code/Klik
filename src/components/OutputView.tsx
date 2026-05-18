import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Download, Eye, Save, Sparkles, Undo, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { ChainAttempt } from './AppShell';
import { cn } from '../lib/utils';

interface OutputViewProps {
  originalImage: string;
  generatedImage: string;
  prompt: string;
  provider?: string;
  attempts?: ChainAttempt[];
  onBack: () => void;
  onRemix: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI gpt-image-1',
  xai: 'xAI Grok',
  fal: 'fal.ai Flux',
  local: 'Local WebGL filters',
};

export function OutputView({
  originalImage,
  generatedImage,
  prompt,
  provider,
  attempts = [],
  onBack,
  onRemix,
}: OutputViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showChain, setShowChain] = useState(false);

  const handleMove = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      setSliderPosition(percent);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const onPointerMove = (e: PointerEvent | React.PointerEvent) => {
    if (isDragging) handleMove((e as any).clientX);
  };

  const onPointerUp = () => setIsDragging(false);

  // Keyboard control for the slider — arrow keys move it 5% per press.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((p) => Math.max(0, p - 5));
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((p) => Math.min(100, p + 5));
      e.preventDefault();
    } else if (e.key === 'Home') {
      setSliderPosition(0);
      e.preventDefault();
    } else if (e.key === 'End') {
      setSliderPosition(100);
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', onPointerMove as any);
      window.addEventListener('pointerup', onPointerUp);
    } else {
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `Klik_${provider ?? 'render'}_${Date.now()}.png`;
    a.click();
  };

  const isLocal = provider === 'local';
  const providerLabel = provider ? PROVIDER_LABELS[provider] ?? provider : 'Unknown';

  // Filter attempts to only ones that actually ran (skip "no key configured"
  // entries that just clutter the display). If only one provider succeeded
  // with no failures along the way, the chain panel adds little info — show
  // it but make the trigger optional.
  const meaningfulAttempts = attempts.filter(
    (a) => a.ok || (a.error && a.error !== 'no key configured')
  );
  const showChainTrigger = meaningfulAttempts.length > 0;

  return (
    <div className="flex flex-col w-full h-full bg-[#1A1A1C] text-white font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-20 bg-[#0D0D0E]/95 border-b border-white/10 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center border border-white/15 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors"
          aria-label="Back to editor"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
        </button>
        <span className="text-[10px] uppercase font-bold tracking-widest text-white/95">
          Render Complete
        </span>
        <button
          onClick={handleDownload}
          className="w-9 h-9 rounded-full bg-black/60 border border-white/15 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 text-white flex items-center justify-center transition-colors"
          aria-label="Download rendered image"
        >
          <Download className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {/* Comparison View */}
      <div className="flex-1 w-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center pt-20 pb-[18rem]">
        <div
          ref={containerRef}
          className="relative w-full max-w-[85%] aspect-[3/4] mx-auto rounded-xl overflow-hidden cursor-ew-resize bg-black shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/15 touch-none z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          role="slider"
          aria-label="Before/after comparison slider. Use arrow keys to compare original and rendered images."
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPosition)}
          aria-valuetext={`${Math.round(sliderPosition)}% original visible`}
          tabIndex={0}
        >
          <img
            src={generatedImage}
            alt="Rendered output"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
            }}
            aria-hidden
          >
            <img
              src={originalImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div
            className="absolute top-0 bottom-0 w-px bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)] flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
            aria-hidden
          >
            <div className="w-6 h-6 rounded border border-blue-400 bg-black/80 backdrop-blur shadow-lg flex items-center justify-center">
              <div className="w-3 h-3 flex justify-between px-0.5">
                <div className="w-px h-full bg-blue-300 rounded-full" />
                <div className="w-px h-full bg-blue-300 rounded-full" />
              </div>
            </div>
          </div>

          <div className="absolute top-4 left-4 bg-black/70 border border-white/15 backdrop-blur text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded text-white/95">
            Source
          </div>
          <div
            className={cn(
              'absolute top-4 right-4 backdrop-blur text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded inline-flex items-center gap-1.5',
              isLocal
                ? 'bg-amber-500/25 border border-amber-400/60 text-amber-100'
                : 'bg-blue-600/25 border border-blue-400/60 text-blue-100'
            )}
          >
            {isLocal ? <Eye className="h-2.5 w-2.5" aria-hidden /> : <Sparkles className="h-2.5 w-2.5" aria-hidden />}
            Render
          </div>
        </div>
      </div>

      {/* Output details */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0D0D0E] p-5 pb-safe border-t border-white/15 rounded-t-2xl z-20">
        {/* Provider badge */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 mb-3',
            isLocal
              ? 'border-amber-400/40 bg-amber-500/10'
              : 'border-blue-400/40 bg-blue-500/10'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isLocal ? (
              <Eye className="h-4 w-4 text-amber-200 shrink-0" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-200 shrink-0" aria-hidden />
            )}
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-widest text-white/65">
                Rendered by
              </div>
              <div className={cn('text-sm font-bold truncate', isLocal ? 'text-amber-100' : 'text-blue-100')}>
                {providerLabel}
              </div>
            </div>
          </div>
          <span
            className={cn(
              'text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded shrink-0',
              isLocal ? 'bg-amber-500/25 text-amber-200' : 'bg-blue-500/25 text-blue-200'
            )}
          >
            {isLocal ? 'Basic' : 'AI'}
          </span>
        </div>

        {/* Chain attempts (collapsible) */}
        {showChainTrigger && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowChain((s) => !s)}
              className="w-full text-left flex items-center justify-between text-[10px] uppercase tracking-widest text-white/65 hover:text-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-1 py-1"
              aria-expanded={showChain}
              aria-controls="chain-attempts-panel"
            >
              <span>
                Chain walked · {meaningfulAttempts.length} provider
                {meaningfulAttempts.length === 1 ? '' : 's'} tried
              </span>
              <span aria-hidden>{showChain ? '−' : '+'}</span>
            </button>
            {showChain && (
              <ul
                id="chain-attempts-panel"
                className="mt-2 space-y-1 rounded-md bg-black/40 border border-white/10 p-2"
                role="list"
              >
                {meaningfulAttempts.map((a, i) => (
                  <li
                    key={`${a.id}-${i}`}
                    className="flex items-start gap-2 text-[11px]"
                  >
                    {a.ok ? (
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" aria-label="success" />
                    ) : (
                      <X className="h-3 w-3 text-red-400 mt-0.5 shrink-0" aria-label="failed" />
                    )}
                    <span className="font-mono text-white/95 min-w-[80px]">
                      {PROVIDER_LABELS[a.id] ?? a.id}
                    </span>
                    {!a.ok && a.error && (
                      <span className="text-white/65 truncate">{a.error}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Prompt */}
        {prompt && (
          <div className="mb-4 text-[11px] text-white/75 leading-snug line-clamp-2">
            <span className="text-[9px] uppercase tracking-widest text-white/65 mr-1">
              Prompt:
            </span>
            {prompt}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRemix}
            className="py-3.5 rounded-xl bg-white/8 border border-white/15 text-white font-semibold flex items-center justify-center space-x-2 w-full hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-colors text-xs"
          >
            <Undo className="w-4 h-4" aria-hidden />
            <span>REMIX</span>
          </button>

          <button
            onClick={handleDownload}
            className={cn(
              'py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 w-full active:scale-[0.98] transition-transform text-xs shadow-lg focus-visible:outline-none focus-visible:ring-2',
              isLocal
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-400 shadow-amber-500/30 focus-visible:ring-amber-400 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400 shadow-blue-500/30 focus-visible:ring-blue-400 text-white'
            )}
          >
            <Save className="w-4 h-4" aria-hidden />
            <span>SAVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}

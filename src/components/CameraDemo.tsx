import { useEffect, useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';

// Animated demo for the landing hero. Loops through the capture →
// generate → compare flow so visitors see what Klik does in ~9 seconds.
// Self-contained: no asset hosting, no external GIF. The "photo" is a
// CSS-painted abstract scene; the "AI transform" is the same scene with
// a heavier color grade and overlay so the before/after slider has a
// visible delta. Respects prefers-reduced-motion by holding the final
// frame statically instead of cycling.

type Stage =
  | 'idle'        // empty viewfinder
  | 'capture'    // shutter flash + photo
  | 'params'     // style chips highlight
  | 'generating' // spinner overlay
  | 'result'     // generated image revealed
  | 'compare';   // slider sweeps

const STAGE_DURATIONS: Record<Stage, number> = {
  idle: 1200,
  capture: 1400,
  params: 1500,
  generating: 1800,
  result: 1500,
  compare: 2400,
};

const STAGE_ORDER: Stage[] = ['idle', 'capture', 'params', 'generating', 'result', 'compare'];

export function CameraDemo() {
  const [stage, setStage] = useState<Stage>('idle');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setStage('result');
      return;
    }
    let cancelled = false;
    const advance = (current: Stage) => {
      const t = window.setTimeout(() => {
        if (cancelled) return;
        const idx = STAGE_ORDER.indexOf(current);
        const next = STAGE_ORDER[(idx + 1) % STAGE_ORDER.length];
        setStage(next);
        advance(next);
      }, STAGE_DURATIONS[current]);
      return t;
    };
    const handle = advance(stage);
    return () => {
      cancelled = true;
      if (handle) clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const showPhoto = stage !== 'idle';
  const showFlash = stage === 'capture';
  const showParams = stage === 'params' || stage === 'generating' || stage === 'result' || stage === 'compare';
  const showSpinner = stage === 'generating';
  const showResult = stage === 'result' || stage === 'compare';
  const showProviderLabel = stage === 'result' || stage === 'compare';
  const compareProgress = stage === 'compare' ? 100 : 0;

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0D0D0E] shadow-[0_30px_80px_-20px_rgba(59,130,246,0.35)]"
      role="img"
      aria-label="Animated demo: a captured photo is sent through the AI provider chain and re-rendered with a cinematic colour grade, then a slider compares the original to the result."
    >
      {/* Layer 0: viewfinder backdrop (always visible) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`border-white/20 ${i % 3 !== 2 ? 'border-r' : ''} ${i < 6 ? 'border-b' : ''}`}
          />
        ))}
      </div>

      {/* Layer 1: original "photo" (faded-in after capture, base layer under the result) */}
      <div
        className={`absolute inset-6 rounded-2xl overflow-hidden transition-opacity duration-700 ${
          showPhoto ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      >
        <SceneArtwork variant="original" />
      </div>

      {/* Layer 2: AI-rendered "photo" (clipped by compare progress in compare stage) */}
      {showResult && (
        <div
          className="absolute inset-6 rounded-2xl overflow-hidden"
          style={{
            clipPath:
              stage === 'compare'
                ? `polygon(${compareProgress}% 0, 100% 0, 100% 100%, ${compareProgress}% 100%)`
                : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            transition: 'clip-path 2.4s cubic-bezier(0.65, 0, 0.35, 1)',
          }}
          aria-hidden
        >
          <SceneArtwork variant="rendered" />
        </div>
      )}

      {/* Slider line for the compare stage */}
      {stage === 'compare' && (
        <div
          className="absolute top-6 bottom-6 w-px bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.6)]"
          style={{
            left: `calc(${compareProgress}% * (100% - 48px) / 100% + 24px)`,
            transition: 'left 2.4s cubic-bezier(0.65, 0, 0.35, 1)',
          }}
          aria-hidden
        />
      )}

      {/* Shutter flash */}
      <div
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-200 ${
          showFlash ? 'opacity-60' : 'opacity-0'
        }`}
        aria-hidden
      />

      {/* Top HUD */}
      <div className="absolute left-4 right-4 top-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-white/85">
        <span className="inline-flex items-center gap-2 rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          {stage === 'idle' || stage === 'capture' ? 'Live' : showResult ? 'Render' : 'Capture'}
        </span>
        {showProviderLabel ? (
          <span className="inline-flex items-center gap-1.5 rounded border border-blue-400/50 bg-blue-500/15 px-2 py-1 text-blue-200">
            <Sparkles className="h-3 w-3" aria-hidden />
            Google Gemini
          </span>
        ) : (
          <span className="rounded border border-white/15 bg-black/50 px-2 py-1 text-white/70">
            4:5
          </span>
        )}
      </div>

      {/* Style chips */}
      <div className="absolute inset-x-4 bottom-24 flex flex-wrap gap-1.5">
        {DEMO_CHIPS.map((s, i) => (
          <span
            key={s}
            className={`rounded px-2 py-1 text-[10px] font-semibold backdrop-blur transition-all duration-300 ${
              showParams
                ? 'bg-blue-500/20 text-blue-100 border border-blue-400/40'
                : 'bg-white/10 text-white/70 border border-transparent'
            }`}
            style={{
              transitionDelay: showParams ? `${i * 80}ms` : '0ms',
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Shutter button — only when idle/capture */}
      {(stage === 'idle' || stage === 'capture') && (
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/30">
            <div
              className={`h-10 w-10 rounded-full bg-white transition-transform duration-150 ${
                stage === 'capture' ? 'scale-90' : ''
              }`}
            />
          </div>
        </div>
      )}

      {/* Generate button — shows once params stage is reached */}
      {(stage === 'params' || stage === 'generating') && (
        <div className="absolute inset-x-6 bottom-6">
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-[11px] font-bold tracking-wider shadow-lg shadow-blue-500/30">
            {showSpinner ? (
              <>
                <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <span>TRYING GOOGLE GEMINI…</span>
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-3 w-3" aria-hidden />
                <span>EXECUTE GENERATION</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Result-stage caption */}
      {showResult && (
        <div className="absolute inset-x-6 bottom-6">
          <div className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
              {stage === 'compare' ? 'Slide to compare' : 'Render complete'}
            </div>
            <div className="mt-0.5 text-[10px] text-white/70">
              cinematic · teal &amp; orange · 35mm · golden hour
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEMO_CHIPS = ['Cinematic', 'Teal & orange', '35mm film', 'Golden hour'];

// Abstract scene painted entirely in CSS — a sun above a horizon line with a
// silhouette. Two variants: the original (cool, soft) and the rendered
// (warm, cinematic, vignetted) — enough delta that the before/after sweep
// reads instantly without needing a photo asset.
function SceneArtwork({ variant }: { variant: 'original' | 'rendered' }) {
  if (variant === 'original') {
    return (
      <div className="relative h-full w-full bg-gradient-to-b from-[#3a4a6b] via-[#4a5a7a] to-[#2a3a55]">
        {/* Sun */}
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 h-20 w-20 rounded-full bg-[#e8d8b8] opacity-70 blur-[2px]" />
        {/* Horizon */}
        <div className="absolute inset-x-0 top-[55%] h-[45%] bg-gradient-to-b from-[#3a4258] to-[#1a2030]" />
        {/* Silhouette */}
        <div
          className="absolute left-1/2 bottom-[18%] -translate-x-1/2 h-[28%] w-[14%] bg-[#1a1f2c]"
          style={{ clipPath: 'polygon(40% 0, 60% 0, 70% 30%, 65% 100%, 35% 100%, 30% 30%)' }}
        />
      </div>
    );
  }
  return (
    <div className="relative h-full w-full bg-gradient-to-b from-[#3a2840] via-[#cc6a3a] to-[#3a1f2e]">
      {/* Sun (warmer, larger glow) */}
      <div className="absolute left-1/2 top-[28%] -translate-x-1/2 h-24 w-24 rounded-full bg-[#fcd7a1] opacity-90 blur-[1px]" />
      <div className="absolute left-1/2 top-[28%] -translate-x-1/2 h-32 w-32 rounded-full bg-[#ff9550] opacity-40 blur-[12px]" />
      {/* Horizon (teal shadows for the teal-and-orange grade) */}
      <div className="absolute inset-x-0 top-[55%] h-[45%] bg-gradient-to-b from-[#1a3340] to-[#0a1620]" />
      {/* Silhouette (warmer rim light) */}
      <div
        className="absolute left-1/2 bottom-[18%] -translate-x-1/2 h-[28%] w-[14%] bg-[#1a1f2c]"
        style={{
          clipPath: 'polygon(40% 0, 60% 0, 70% 30%, 65% 100%, 35% 100%, 30% 30%)',
          boxShadow: '0 0 10px rgba(255,150,80,0.4)',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {/* Grain overlay — tiny SVG noise, very subtle */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        }}
      />
    </div>
  );
}

import { useRef } from 'react';
import { Link } from 'wouter';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Camera,
  Wand2,
  Sparkles,
  Sliders,
  Network,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Github,
  Eye,
} from 'lucide-react';
import { Button } from './ui/button';
import { CameraDemo } from './CameraDemo';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface LandingViewProps {
  hasSession: boolean;
}

export function LandingView({ hasSession }: LandingViewProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Respect prefers-reduced-motion: skip entrance + scroll animations.
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('[data-anim="hero-eyebrow"]', { y: 12, opacity: 0, duration: 0.5 })
        .from(
          '[data-anim="hero-title"] > span',
          { y: 28, opacity: 0, duration: 0.7, stagger: 0.08 },
          '-=0.2'
        )
        .from('[data-anim="hero-sub"]', { y: 12, opacity: 0, duration: 0.5 }, '-=0.3')
        .from(
          '[data-anim="hero-cta"]',
          { y: 12, opacity: 0, duration: 0.5, stagger: 0.08 },
          '-=0.3'
        )
        .from(
          '[data-anim="hero-preview"]',
          { y: 24, opacity: 0, scale: 0.96, duration: 0.8 },
          '-=0.5'
        );

      gsap.from('[data-anim="feature-card"]', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.08,
        scrollTrigger: {
          trigger: '[data-anim="features"]',
          start: 'top 85%',
        },
      });

      gsap.from('[data-anim="chain-step"]', {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.1,
        scrollTrigger: {
          trigger: '[data-anim="chain"]',
          start: 'top 80%',
        },
      });

      gsap.to('[data-anim="aurora"]', {
        backgroundPosition: '200% 0%',
        duration: 18,
        ease: 'none',
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="min-h-[100dvh] w-full bg-aurora text-white">
      {/* Skip link for keyboard users (visually shown only on focus) */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-blue-600 focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-white focus-visible:outline-none"
      >
        Skip to main content
      </a>

      {/* Top nav */}
      <header className="relative z-20 w-full">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]"
            aria-label="Klik home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <Camera className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-base font-bold tracking-tight">Klik</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/80 md:flex" aria-label="Primary">
            <a href="#features" className="rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]">
              Features
            </a>
            <a href="#chain" className="rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]">
              Provider chain
            </a>
            <a href="#how" className="rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]">
              How it works
            </a>
            <a
              href="https://github.com/blisse-code/Klik"
              target="_blank"
              rel="noreferrer"
              className="rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]"
            >
              GitHub
            </a>
          </nav>
          <Button asChild size="sm" variant={hasSession ? 'default' : 'secondary'}>
            <Link href="/app">
              {hasSession ? 'Open camera' : 'Get started'}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section id="main" className="relative overflow-hidden">
        <div
          data-anim="aurora"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'linear-gradient(120deg, rgba(59,130,246,0.18) 0%, rgba(167,139,250,0.18) 40%, rgba(244,114,182,0.12) 80%)',
            backgroundSize: '200% 200%',
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-50 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,black,transparent)]" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-12 md:grid-cols-2 md:gap-16 md:px-8 md:pb-32 md:pt-20">
          <div>
            <div
              data-anim="hero-eyebrow"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur"
            >
              <Network className="h-3 w-3 text-blue-300" aria-hidden />
              Multi-provider AI chain · WebGL local fallback
            </div>
            <h1
              data-anim="hero-title"
              className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
            >
              <span className="block">The AI camera</span>
              <span className="block">that shoots in</span>
              <span className="block text-gradient-brand">your style.</span>
            </h1>
            <p
              data-anim="hero-sub"
              className="mt-6 max-w-xl text-base leading-relaxed text-white/80 md:text-lg"
            >
              Capture a photo, dial in style, color grade, camera simulation, texture, and
              ambience &mdash; then send it through your own chain of AI providers
              (Gemini, OpenAI, Grok, fal.ai). If a provider hits quota or you've added no
              keys at all, an in-browser WebGL filter pipeline takes over so you still
              get an image.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" data-anim="hero-cta">
                <Link href="/app">
                  Start shooting <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" data-anim="hero-cta">
                <a href="#chain">See the chain</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-white/65">
              No API key required to start &middot; local filters always work &middot; add
              keys later for AI generation.
            </p>
          </div>

          {/* Hero preview — animated demo */}
          <div
            data-anim="hero-preview"
            className="relative mx-auto w-full max-w-md md:max-w-none"
          >
            <CameraDemo />

            {/* Floating prompt card */}
            <div className="absolute -bottom-6 -left-4 hidden w-64 rounded-2xl border border-white/15 bg-[#131316]/95 p-4 shadow-2xl backdrop-blur md:block">
              <div className="text-[9px] font-bold uppercase tracking-widest text-blue-300">
                Live demo
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/75">
                Capture → pick style → chain walks Gemini → render. Slide to compare.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modes — AI vs filters */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <ModeCard
            tone="ai"
            badge="Advanced"
            title="AI generation"
            body="With one or more provider keys configured, Klik renders through the foundation/open-source models you've added. Each generation walks the chain top-to-bottom and uses the first one that succeeds."
            bullets={[
              'Google Gemini (free + paid tiers)',
              'OpenAI gpt-image-1 image-to-image',
              'xAI Grok-image (text-to-image)',
              'fal.ai Flux open-source models',
            ]}
            cta={{ label: 'Add keys in Settings', href: '/app' }}
          />
          <ModeCard
            tone="filter"
            badge="Always on"
            title="Local filters · Basic mode"
            body="A 2-pass WebGL pipeline runs entirely in your browser. Colour grade, vignette, grain, halation, and camera-specific frame overlays — no key, no network, no AI. The floor of the chain."
            bullets={[
              'Runs with zero API keys after sign-in',
              'Instant — no waiting on a server',
              'Same style controls as AI mode',
              'Polaroid / 35mm / disposable frames',
            ]}
            cta={{ label: 'Sign in to start', href: '/app' }}
          />
        </div>
      </section>

      {/* Provider chain explainer */}
      <section
        id="chain"
        data-anim="chain"
        className="relative mx-auto max-w-6xl px-5 pb-24 md:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
            Provider chain
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            If not this, then that.
          </h2>
          <p className="mt-3 text-white/75">
            One generation, many chances to succeed. Drop in any combination of providers,
            set the priority order, and Klik falls through automatically on auth, quota,
            or network failures.
          </p>
        </div>

        <div className="mt-14 overflow-x-auto pb-2">
          <ol className="flex min-w-max items-stretch gap-3 mx-auto justify-center" role="list">
            {CHAIN_STEPS.map((step, i) => (
              <li
                key={step.id}
                data-anim="chain-step"
                className="flex items-center gap-3"
              >
                <div
                  className={`flex w-52 flex-col rounded-2xl border p-4 ${
                    step.kind === 'local'
                      ? 'border-amber-400/40 bg-amber-500/8'
                      : step.kind === 'oss'
                        ? 'border-emerald-400/40 bg-emerald-500/8'
                        : 'border-blue-400/40 bg-blue-500/8'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/70">
                      #{i + 1}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        step.kind === 'local'
                          ? 'border-amber-400/50 text-amber-200'
                          : step.kind === 'oss'
                            ? 'border-emerald-400/50 text-emerald-200'
                            : 'border-blue-400/50 text-blue-200'
                      }`}
                    >
                      {step.kind === 'local' ? 'Local' : step.kind === 'oss' ? 'OSS' : 'Foundation'}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{step.label}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/65">
                    {step.desc}
                  </p>
                </div>
                {i < CHAIN_STEPS.length - 1 && (
                  <span className="hidden text-white/40 md:inline" aria-hidden>
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 mx-auto max-w-3xl rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-center text-[11px] leading-relaxed text-white/75">
            <span className="font-mono font-semibold text-blue-300">Example.</span>{' '}
            Gemini key has hit free-tier quota → fall through to OpenAI → key invalid →
            fall through to fal.ai → success. The output panel tells you{' '}
            <em>exactly</em> which providers were tried and which one rendered.
          </p>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        data-anim="features"
        className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
            Features
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            A studio in your pocket.
          </h2>
          <p className="mt-3 text-white/75">
            Seven independent style axes. Multiple providers. Always-available WebGL
            fallback. One tap to compare.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              data-anim="feature-card"
              className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-6 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 ring-1 ring-blue-300/30">
                <f.icon className="h-5 w-5 text-blue-200" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
            Workflow
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Three taps to a new aesthetic.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-white/12 bg-white/[0.03] p-6"
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-300">
                Step {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-blue-600/25 via-indigo-600/20 to-fuchsia-600/20 p-10 md:p-14">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Start free. Add keys when you want AI.
              </h2>
              <p className="mt-2 max-w-xl text-white/85">
                Sign up, capture, render. The local pipeline runs without any keys —
                paste a Gemini, OpenAI, or fal.ai key whenever you're ready for AI.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/app">
                Launch the camera <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-white/65 md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5" aria-hidden />
            <span>Klik &middot; multi-provider AI camera</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/blisse-code/Klik"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]"
            >
              <Github className="h-3.5 w-3.5" aria-hidden /> Source
            </a>
            <a
              href="https://buymeacoffee.com/blisse.code"
              target="_blank"
              rel="noreferrer"
              className="rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]"
            >
              Buy me a coffee
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface ModeCardProps {
  tone: 'ai' | 'filter';
  badge: string;
  title: string;
  body: string;
  bullets: string[];
  cta: { label: string; href: string };
}

function ModeCard({ tone, badge, title, body, bullets, cta }: ModeCardProps) {
  const aiTone = tone === 'ai';
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-6 ${
        aiTone
          ? 'border-blue-400/30 bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-transparent'
          : 'border-amber-400/30 bg-gradient-to-br from-amber-500/12 via-orange-500/8 to-transparent'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
            aiTone
              ? 'border-blue-300/50 bg-blue-500/15 text-blue-100'
              : 'border-amber-300/50 bg-amber-500/15 text-amber-100'
          }`}
        >
          {aiTone ? <Sparkles className="h-3 w-3" aria-hidden /> : <Eye className="h-3 w-3" aria-hidden />}
          {badge}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-widest text-white/65">
          {aiTone ? 'needs API key' : 'no key required'}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/80">{body}</p>
      <ul className="mt-4 space-y-1.5" role="list">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[12px] text-white/75">
            <span
              className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${aiTone ? 'bg-blue-300' : 'bg-amber-300'}`}
              aria-hidden
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Button asChild size="sm" variant="outline" className="mt-5">
        <Link href={cta.href}>
          {cta.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}

const CHAIN_STEPS = [
  {
    id: 'gemini',
    kind: 'foundation' as const,
    label: 'Google Gemini',
    desc: 'Free 2.5-flash-image then paid 3-pro-image inside the adapter.',
  },
  {
    id: 'openai',
    kind: 'foundation' as const,
    label: 'OpenAI gpt-image-1',
    desc: 'Image-to-image edits via the official /v1/images/edits endpoint.',
  },
  {
    id: 'xai',
    kind: 'foundation' as const,
    label: 'xAI Grok-image',
    desc: 'Text-to-image — useful as a fallback when other foundations fail.',
  },
  {
    id: 'fal',
    kind: 'oss' as const,
    label: 'fal.ai Flux',
    desc: 'Open-source Flux/SDXL image-to-image, pay-per-second.',
  },
  {
    id: 'local',
    kind: 'local' as const,
    label: 'Local WebGL filters',
    desc: 'Always-available browser pipeline. No key, no network, no AI.',
  },
];

const FEATURES = [
  {
    icon: Network,
    title: 'Configurable provider chain',
    body: 'Add keys for Gemini, OpenAI, xAI, and fal.ai. Reorder them. Klik falls through on failure so one bad provider doesn\'t kill your render.',
  },
  {
    icon: Cpu,
    title: 'WebGL local fallback',
    body: 'A 2-pass shader pipeline runs in the browser when AI providers are unavailable or you have no keys configured. Instant, offline-capable.',
  },
  {
    icon: Sliders,
    title: '7-axis style controls',
    body: 'Mode, aesthetic, color grade, camera sim, texture, ambience, and resolution &mdash; mixed and matched on every render.',
  },
  {
    icon: Camera,
    title: 'Camera or upload',
    body: 'Front/back capture from any device, or upload an existing photo. Composition grid included on capture.',
  },
  {
    icon: Wand2,
    title: 'Before/after slider',
    body: 'Drag to compare the source against the render. One tap to download. The output card tells you which provider rendered it.',
  },
  {
    icon: ShieldCheck,
    title: 'Per-user encrypted keys',
    body: 'Your provider keys live in your private profile row with Supabase row-level security. Never shared across accounts.',
  },
];

const STEPS = [
  {
    title: 'Sign up (or skip)',
    body: 'Email + password via Supabase. You can also just open the camera and render with the local pipeline — no account needed for filters.',
  },
  {
    title: 'Capture & dial in',
    body: 'Use your camera or upload an image. Pick style, color grade, camera sim, ambience, and more from the seven controls.',
  },
  {
    title: 'Render & compare',
    body: 'Tap generate. The chain runs (or filters apply instantly). Drag the slider to compare. Download in one tap.',
  },
];

import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Camera,
  Wand2,
  Sparkles,
  Sliders,
  Zap,
  ShieldCheck,
  ArrowRight,
  Github,
} from 'lucide-react';
import { Button } from './ui/button';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface LandingViewProps {
  hasSession: boolean;
}

export function LandingView({ hasSession }: LandingViewProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
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
      {/* Top nav */}
      <header className="relative z-20 w-full">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <Camera className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">Klik</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a
              href="https://github.com/blisse-code/bc-ai-camera-pro"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              GitHub
            </a>
          </nav>
          <Button asChild size="sm" variant={hasSession ? 'default' : 'secondary'}>
            <Link href="/app">
              {hasSession ? 'Open camera' : 'Sign in'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          data-anim="aurora"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'linear-gradient(120deg, rgba(59,130,246,0.18) 0%, rgba(167,139,250,0.18) 40%, rgba(244,114,182,0.12) 80%)',
            backgroundSize: '200% 200%',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-50 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-12 md:grid-cols-2 md:gap-16 md:px-8 md:pb-32 md:pt-20">
          <div>
            <div
              data-anim="hero-eyebrow"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 backdrop-blur"
            >
              <Sparkles className="h-3 w-3 text-blue-400" />
              Powered by Gemini 3 image models
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
              className="mt-6 max-w-xl text-base leading-relaxed text-white/65 md:text-lg"
            >
              Capture or upload a photo, dial in style, aesthetic, color grade, camera
              simulation, texture, and ambience &mdash; then re-render it through Google's
              latest image models. Bring your own key, keep your aesthetic.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" data-anim="hero-cta">
                <Link href="/app">
                  Start shooting <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" data-anim="hero-cta">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-white/40">
              Free to use &middot; you bring your own Gemini API key &middot; nothing leaves
              your account.
            </p>
          </div>

          {/* Hero preview */}
          <div
            data-anim="hero-preview"
            className="relative mx-auto w-full max-w-md md:max-w-none"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0D0D0E] shadow-[0_30px_80px_-20px_rgba(59,130,246,0.35)]">
              {/* Faux camera viewfinder */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={`border-white/20 ${i % 3 !== 2 ? 'border-r' : ''} ${
                      i < 6 ? 'border-b' : ''
                    }`}
                  />
                ))}
              </div>

              {/* Top HUD */}
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-white/80">
                <span className="inline-flex items-center gap-2 rounded border border-white/10 bg-black/40 px-2 py-1 backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  Pro
                </span>
                <span className="rounded border border-blue-500/40 bg-blue-600/15 px-2 py-1 text-blue-300">
                  Nano Banana 2
                </span>
              </div>

              {/* Style chips */}
              <div className="absolute inset-x-4 bottom-28 flex flex-wrap gap-1.5">
                {['Cinematic', 'Teal & orange', '35mm film', 'Golden hour'].map((s) => (
                  <span
                    key={s}
                    className="rounded bg-white/8 px-2 py-1 text-[10px] font-semibold text-white/85 backdrop-blur"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Shutter */}
              <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/25">
                  <div className="h-12 w-12 rounded-full bg-white" />
                </div>
              </div>
            </div>

            {/* Floating prompt card */}
            <div className="absolute -bottom-6 -left-4 hidden w-64 rounded-2xl border border-white/10 bg-[#131316]/95 p-4 shadow-2xl backdrop-blur md:block">
              <div className="text-[9px] font-bold uppercase tracking-widest text-blue-400">
                Generated logic prompt
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/70">
                Photorealistic &middot; cinematic &middot; teal &amp; orange &middot; 35mm
                film &middot; golden hour
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        data-anim="features"
        className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28"
      >
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
            Features
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            A studio in your pocket.
          </h2>
          <p className="mt-3 text-white/60">
            Seven independent style axes, two swappable Gemini models, and a one-tap
            before/after slider.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              data-anim="feature-card"
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 ring-1 ring-blue-400/20">
                <f.icon className="h-5 w-5 text-blue-300" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
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
              className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-6"
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400">
                Step {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-fuchsia-600/15 p-10 md:p-14">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Bring your own key. Shoot anything.
              </h2>
              <p className="mt-2 max-w-xl text-white/70">
                Sign up, paste a Gemini API key, and you're rendering in under a minute.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/app">
                Launch the camera <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-white/40 md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5" />
            <span>Klik &middot; AI camera, your style</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/blisse-code/bc-ai-camera-pro"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <Github className="h-3.5 w-3.5" /> Source
            </a>
            <a
              href="https://buymeacoffee.com/blisse.code"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              Buy me a coffee
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: Camera,
    title: 'Camera or upload',
    body: 'Front/back capture from any device, or upload an existing photo. Composition grid included.',
  },
  {
    icon: Sliders,
    title: '7-axis style controls',
    body: 'Mode, aesthetic, color grade, camera sim, texture, ambience, and resolution &mdash; mixed and matched.',
  },
  {
    icon: Wand2,
    title: 'Before/after slider',
    body: 'Drag to compare the source against the render. One tap to download the final image.',
  },
  {
    icon: Zap,
    title: 'Swappable models',
    body: 'Default to Nano Banana 2 for speed, switch to Gemini 3.1 Pro when you need fidelity.',
  },
  {
    icon: ShieldCheck,
    title: 'Bring your own key',
    body: 'Your Gemini key lives in your private profile row with Supabase row-level security.',
  },
  {
    icon: Sparkles,
    title: 'Identity-preserving',
    body: 'Prompts are tuned to preserve subject, pose, composition, clothing, and facial details.',
  },
];

const STEPS = [
  {
    title: 'Sign up & add a key',
    body: 'Email + password via Supabase, then paste your own Gemini API key in Settings.',
  },
  {
    title: 'Capture or upload',
    body: 'Use your camera or upload an existing image. Pick the look you want from the seven controls.',
  },
  {
    title: 'Render & compare',
    body: 'Tap generate. Drag the slider to compare. Download the final render in one tap.',
  },
];

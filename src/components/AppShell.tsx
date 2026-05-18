import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AnimatePresence } from 'motion/react';
import { Home, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { CameraView } from './CameraView';
import { EditorView } from './EditorView';
import { OutputView } from './OutputView';
import { LoadingOverlay } from './LoadingOverlay';
import { AuthView } from './AuthView';
import { SettingsView } from './SettingsView';
import { useSession, fetchProfile } from '../lib/auth';
import { applyFilters } from '../lib/filters/pipeline';
import {
  DEFAULT_PROVIDER_ORDER,
  PROVIDERS,
  type ImageParams,
  type ProviderId,
  type ProviderKeys,
} from '../lib/providers';

type ViewState = 'camera' | 'editor' | 'output' | 'settings';

export function AppShell() {
  const { session, loading } = useSession();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<ViewState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptUsed, setPromptUsed] = useState<string>('');
  const [providerUsed, setProviderUsed] = useState<string>('');
  const [providerKeys, setProviderKeys] = useState<ProviderKeys>({});
  const [providerOrder, setProviderOrder] = useState<ProviderId[]>(DEFAULT_PROVIDER_ORDER);

  useEffect(() => {
    document.body.setAttribute('data-app-mode', 'capture');
    return () => {
      document.body.removeAttribute('data-app-mode');
    };
  }, []);

  const refreshProfile = (uid: string) => {
    fetchProfile(uid)
      .then((p) => {
        if (p) {
          setProviderKeys(p.provider_keys);
          setProviderOrder(p.provider_order);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!session?.user) {
      setProviderKeys({});
      setProviderOrder(DEFAULT_PROVIDER_ORDER);
      return;
    }
    refreshProfile(session.user.id);
  }, [session?.user?.id]);

  const hasAnyApiKey = (Object.keys(providerKeys) as ProviderId[]).some(
    (id) => PROVIDERS[id]?.needsKey && (providerKeys[id]?.length ?? 0) > 0
  );

  const handleCapture = (base64: string) => {
    setCapturedImage(base64);
    setView('editor');
  };

  const runLocalFallback = async (params: ImageParams) => {
    if (!capturedImage) return;
    const out = await applyFilters(capturedImage, params);
    setGeneratedImage(out);
    setPromptUsed(`${params.aesthetic} • ${params.colourGrade} • ${params.cameraType} • ${params.ambience}`);
    setProviderUsed('local');
    setView('output');
  };

  const handleGenerate = async (params: ImageParams) => {
    if (!capturedImage) return;
    setIsGenerating(true);
    try {
      // If the user has no foundation/oss keys AND has local in the chain,
      // skip the network round-trip and filter locally.
      if (!hasAnyApiKey || !session) {
        if (providerOrder.includes('local')) {
          await runLocalFallback(params);
          return;
        }
      }

      if (session) {
        const res = await fetch('/api/transform', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            imageParams: params,
            base64ImageContext: capturedImage,
          }),
        });
        const data = await res.json();

        if (res.ok && data.imageUrl) {
          setGeneratedImage(data.imageUrl);
          setPromptUsed(data.prompt ?? '');
          setProviderUsed(data.provider ?? '');
          setView('output');
          return;
        }
        if (data.shouldFallbackLocal || providerOrder.includes('local')) {
          await runLocalFallback(params);
          return;
        }
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      if (providerOrder.includes('local')) {
        try {
          await runLocalFallback(params);
          return;
        } catch (filterErr: any) {
          alert(`Generation failed: ${err.message}. Local filter also failed: ${filterErr.message}`);
          return;
        }
      }
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0A0A0B] text-white relative flex justify-center items-center">
      <div className="w-full max-w-md h-full relative overflow-hidden bg-[#1A1A1C] shadow-2xl border-x border-white/5">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        )}

        {!loading && !session && (
          <AuthView onBackToLanding={() => setLocation('/')} />
        )}

        {!loading && session && view === 'settings' && (
          <SettingsView
            userId={session.user.id}
            email={session.user.email ?? ''}
            onBack={() => setView('camera')}
            onSaved={() => refreshProfile(session.user.id)}
          />
        )}

        {!loading && session && view === 'camera' && (
          <>
            <CameraView onCapture={handleCapture} />
            <Link
              href="/"
              className="absolute top-5 left-5 z-30 w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors"
              aria-label="Back to landing page"
            >
              <Home className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setView('settings')}
              className="absolute top-5 right-5 z-30 w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            {!hasAnyApiKey && (
              <div className="absolute top-16 left-5 right-5 z-30 text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-200 rounded-md px-3 py-2 leading-snug">
                No AI keys configured — generations will run through the local
                filter pipeline. Add a provider key in Settings for AI generation.
              </div>
            )}
          </>
        )}

        {!loading && session && view === 'editor' && capturedImage && (
          <EditorView
            image={capturedImage}
            providerOrder={providerOrder}
            providerKeys={providerKeys}
            onBack={() => {
              setCapturedImage(null);
              setView('camera');
            }}
            onGenerate={handleGenerate}
          />
        )}

        {!loading && session && view === 'output' && capturedImage && generatedImage && (
          <OutputView
            originalImage={capturedImage}
            generatedImage={generatedImage}
            prompt={promptUsed}
            provider={providerUsed}
            onBack={() => {
              setGeneratedImage(null);
              setView('editor');
            }}
            onRemix={() => setView('editor')}
          />
        )}

        <AnimatePresence>{isGenerating && <LoadingOverlay />}</AnimatePresence>
      </div>
    </div>
  );
}

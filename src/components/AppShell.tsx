import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AnimatePresence } from 'motion/react';
import { Home, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { CameraView } from './CameraView';
import { EditorView, ImageParams } from './EditorView';
import { OutputView } from './OutputView';
import { LoadingOverlay } from './LoadingOverlay';
import { AuthView } from './AuthView';
import { SettingsView } from './SettingsView';
import { useSession, fetchProfile } from '../lib/auth';
import { DEFAULT_MODEL, ModelKey } from '../lib/models';

type ViewState = 'camera' | 'editor' | 'output' | 'settings';

export function AppShell() {
  const { session, loading } = useSession();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<ViewState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptUsed, setPromptUsed] = useState<string>('');
  const [defaultModel, setDefaultModel] = useState<ModelKey>(DEFAULT_MODEL);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    document.body.setAttribute('data-app-mode', 'capture');
    return () => {
      document.body.removeAttribute('data-app-mode');
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setHasApiKey(false);
      return;
    }
    fetchProfile(session.user.id)
      .then((p) => {
        setHasApiKey(!!p?.gemini_api_key);
        if (p?.preferred_model) setDefaultModel(p.preferred_model as ModelKey);
        if (!p?.gemini_api_key) setView('settings');
      })
      .catch(() => setHasApiKey(false));
  }, [session?.user?.id]);

  const handleCapture = (base64: string) => {
    setCapturedImage(base64);
    setView('editor');
  };

  const handleGenerate = async (params: ImageParams, model: ModelKey) => {
    if (!capturedImage || !session) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageParams: params,
          base64ImageContext: capturedImage,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');

      setGeneratedImage(data.imageUrl);
      setPromptUsed(data.prompt);
      setView('output');
    } catch (err: any) {
      console.error(err);
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0A0A0B] text-white relative flex justify-center items-center">
      <div className="w-full max-w-md md:max-w-lg h-full relative overflow-hidden bg-[#1A1A1C] shadow-2xl border-x border-white/5">
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
            onSaved={() => {
              setHasApiKey(true);
              fetchProfile(session.user.id).then((p) => {
                if (p?.preferred_model) setDefaultModel(p.preferred_model as ModelKey);
              });
            }}
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
            {!hasApiKey && (
              <div className="absolute top-16 left-5 right-5 z-30 text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-200 rounded-md px-3 py-2">
                Add a Gemini API key in Settings to generate images.
              </div>
            )}
          </>
        )}

        {!loading && session && view === 'editor' && capturedImage && (
          <EditorView
            image={capturedImage}
            defaultModel={defaultModel}
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

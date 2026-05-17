import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { EditorView, ImageParams } from './components/EditorView';
import { OutputView } from './components/OutputView';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AnimatePresence } from 'motion/react';

type ViewState = 'camera' | 'editor' | 'output';

export default function App() {
  const [view, setView] = useState<ViewState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptUsed, setPromptUsed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCapture = (base64: string) => {
    setCapturedImage(base64);
    setView('editor');
  };

  const handleGenerate = async (params: ImageParams) => {
    if (!capturedImage) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageParams: params,
          base64ImageContext: capturedImage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.imageUrl);
      setPromptUsed(data.prompt);
      setView('output');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
      // Optional: show a toast or alert instead of completely breaking UX
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0A0A0B] text-white relative flex justify-center items-center">
      {/* Container for mobile max width constraint on desktop browsers */}
      <div className="w-full max-w-md h-full relative overflow-hidden bg-[#1A1A1C] shadow-2xl border-x border-white/5">
        
        {view === 'camera' && (
          <CameraView onCapture={handleCapture} />
        )}

        {view === 'editor' && capturedImage && (
          <EditorView 
            image={capturedImage} 
            onBack={() => {
              setCapturedImage(null);
              setView('camera');
            }} 
            onGenerate={handleGenerate} 
          />
        )}

        {view === 'output' && capturedImage && generatedImage && (
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

        <AnimatePresence>
          {isGenerating && (
            <LoadingOverlay />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

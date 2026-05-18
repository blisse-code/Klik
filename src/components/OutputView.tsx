import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, Share2, Save, Undo, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface OutputViewProps {
  originalImage: string;
  generatedImage: string;
  prompt: string;
  provider?: string;
  onBack: () => void;
  onRemix: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI gpt-image-1',
  xai: 'xAI Grok',
  fal: 'fal.ai Flux',
  local: 'Local filters',
};

export function OutputView({ originalImage, generatedImage, prompt, provider, onBack, onRemix }: OutputViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    if (isDragging) {
      handleMove((e as any).clientX);
    }
  };

  const onPointerUp = () => {
    setIsDragging(false);
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
    a.download = `AI_Camera_Render_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#1A1A1C] text-white font-sans overflow-hidden">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-20 bg-[#0D0D0E]/90 border-b border-white/5 backdrop-blur-sm">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">
          Render Complete
        </span>
        <div className="flex space-x-2">
          <button onClick={handleDownload} className="w-9 h-9 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparison View */}
      <div className="flex-1 w-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center pt-20 pb-40">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
          <div className="border-r border-b border-white/20"></div>
          <div className="border-r border-b border-white/20"></div>
          <div className="border-b border-white/20"></div>
          <div className="border-r border-b border-white/20"></div>
          <div className="border-r border-b border-white/20"></div>
          <div className="border-b border-white/20"></div>
          <div className="border-r border-white/20"></div>
          <div className="border-r border-white/20"></div>
          <div></div>
        </div>
        <div 
          ref={containerRef}
          className="relative w-full max-w-[85%] aspect-[3/4] mx-auto rounded-xl overflow-hidden cursor-ew-resize bg-black shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/10 touch-none z-10"
          onPointerDown={onPointerDown}
        >
          {/* Target / Generated (Bottom layer) */}
          <img 
            src={generatedImage} 
            alt="Generated" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Original (Top layer clipped) */}
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          >
            <img 
              src={originalImage} 
              alt="Original" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Slider Line */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-6 h-6 rounded border border-blue-500 bg-black/80 backdrop-blur shadow-lg flex items-center justify-center">
              <div className="w-3 h-3 flex justify-between px-0.5">
                <div className="w-px h-full bg-blue-400 rounded-full"/>
                <div className="w-px h-full bg-blue-400 rounded-full"/>
              </div>
            </div>
          </div>
          
          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black/60 border border-white/10 backdrop-blur text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded text-white/80">
            Source
          </div>
          <div className="absolute top-4 right-4 bg-blue-600/20 border border-blue-500/50 backdrop-blur text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded text-blue-400">
            Render
          </div>
        </div>
      </div>

      {/* Settings Summary & Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0D0D0E] p-6 pb-safe border-t border-white/10 rounded-t-2xl z-20">
        <div className="flex items-center justify-between mb-5">
          <div className="text-left flex-1 min-w-0 pr-4">
            <h3 className="text-xs font-bold tracking-widest text-white/90 uppercase">Output Details</h3>
            <p className="text-[10px] text-white/40 mt-1 truncate">
              {prompt}
            </p>
            {provider && (
              <p className="text-[9px] text-blue-400/80 mt-1 font-mono uppercase tracking-wider">
                rendered by {PROVIDER_LABELS[provider] ?? provider}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <button 
            onClick={onRemix}
            className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold flex items-center justify-center space-x-2 w-full hover:bg-white/10 transition-colors text-xs"
          >
            <Undo className="w-4 h-4" />
            <span>REMIX</span>
          </button>
          
          <button 
            onClick={handleDownload}
            className="py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-500 text-white font-bold flex items-center justify-center space-x-2 w-full active:scale-[0.98] transition-transform text-xs shadow-lg shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            <span>SAVE TO ROLL</span>
          </button>
        </div>
      </div>

    </div>
  );
}

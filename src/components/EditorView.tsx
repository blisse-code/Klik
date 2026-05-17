import React, { useState } from 'react';
import { ArrowLeft, Wand2, SlidersHorizontal, ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface ImageParams {
  mode: string;
  aesthetic: string;
  colourGrade: string;
  cameraType: string;
  resolutionLabel: string;
  filterTexture: string;
  ambience: string;
}

interface EditorViewProps {
  image: string;
  onBack: () => void;
  onGenerate: (params: ImageParams) => void;
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
  mode: "Style Mode",
  aesthetic: "Aesthetic Direction",
  colourGrade: "Color Grade",
  cameraType: "Camera Simulation",
  filterTexture: "Texture & Filter",
  ambience: "Ambience",
  resolutionLabel: "Resolution",
};

export function EditorView({ image, onBack, onGenerate }: EditorViewProps) {
  const [params, setParams] = useState<ImageParams>({
    mode: 'Photorealistic',
    aesthetic: 'Natural lifestyle',
    colourGrade: 'Natural',
    cameraType: 'DSLR',
    resolutionLabel: '4K',
    filterTexture: 'Clean',
    ambience: 'Original scene',
  });

  const [activeTab, setActiveTab] = useState<ParamKey>('mode');

  const updateParam = (key: ParamKey, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#1A1A1C] text-white overflow-hidden">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-20 bg-[#0D0D0E]/90 border-b border-white/5 backdrop-blur-sm">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] uppercase font-bold tracking-widest flex items-center text-white/90">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          AI Control Engine
        </span>
        <div className="w-9" />
      </div>

      {/* Main Preview */}
      <div className="flex-1 relative flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 overflow-hidden p-6 mt-16 pb-64">
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
        <motion.img 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          src={image} 
          alt="Source" 
          className="w-full h-full object-contain max-h-[45vh] rounded-xl border border-white/10 shadow-2xl z-10"
        />
      </div>

      {/* Controls Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0D0D0E] border-t border-white/10 rounded-t-2xl flex flex-col max-h-[55vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar px-5 pt-4 pb-0 space-x-6 border-b border-white/5">
          {(Object.keys(PARAM_LABELS) as ParamKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "whitespace-nowrap text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 py-3",
                activeTab === key ? "text-blue-400 border-b-2 border-blue-500" : "text-white/40 hover:text-white/70 border-b-2 border-transparent"
              )}
            >
              {PARAM_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Dynamic Options for active tab */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">
           <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-2"
            >
              {PARAM_OPTIONS[activeTab].map((option) => (
                <button
                  key={option}
                  onClick={() => updateParam(activeTab, option)}
                  className={cn(
                    "px-3 py-1.5 rounded text-[11px] font-semibold transition-all duration-200",
                    params[activeTab] === option 
                      ? "bg-blue-600 border border-blue-500 text-white" 
                      : "bg-white/5 text-white/70 border border-transparent hover:bg-white/10"
                  )}
                >
                  {option}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Generate Button Container */}
        <div className="p-5 bg-black/40 border-t border-white/10 space-y-4 pb-safe">
          <div className="bg-black p-3 rounded-md border border-white/5">
            <div className="text-[9px] text-blue-400 uppercase font-bold mb-1 tracking-tighter">Generated Logic Prompt</div>
            <p className="text-[10px] text-white/50 leading-relaxed italic truncate">
              {params.mode} • {params.aesthetic} • {params.resolutionLabel} • {params.ambience}
            </p>
          </div>
          <button 
            onClick={() => onGenerate(params)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
          >
            <Wand2 className="w-4 h-4" />
            <span>EXECUTE GENERATION</span>
          </button>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "EXECUTING GENERATION" }: LoadingOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0D0E]/90 backdrop-blur-md"
    >
      <div className="w-16 h-16 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin mb-6" />
      <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-blue-400">
        {message}
      </h2>
      <p className="text-[10px] text-white/40 mt-3 uppercase tracking-widest font-mono">
        Aligning visual matrices...
      </p>
    </motion.div>
  );
}

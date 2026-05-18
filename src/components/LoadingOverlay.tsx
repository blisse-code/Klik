import { motion } from 'motion/react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'EXECUTING GENERATION' }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0D0E]/95 backdrop-blur-md"
      role="status"
      aria-live="assertive"
      aria-busy="true"
    >
      <div
        className="w-16 h-16 border-2 border-blue-400/60 border-t-blue-400 rounded-full animate-spin motion-reduce:animate-none motion-reduce:border-t-blue-400/60 mb-6"
        aria-hidden
      />
      <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-blue-200">
        {message}
      </h2>
      <p className="text-[10px] text-white/70 mt-3 uppercase tracking-widest font-mono">
        Walking the chain…
      </p>
    </motion.div>
  );
}

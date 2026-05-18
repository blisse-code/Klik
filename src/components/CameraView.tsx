import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface CameraViewProps {
  onCapture: (base64: string) => void;
}

export function CameraView({ onCapture }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err: any) {
      console.error("Camera access denied or error:", err);
      setError("Please allow camera access or use the upload button.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Match what the viewfinder shows: video is rendered with object-cover,
      // so the displayed area is the centered crop of the source frame that
      // fits the container aspect ratio. We capture only that visible region.
      const rect = video.getBoundingClientRect();
      const containerAR = rect.width / rect.height;
      const sourceAR = video.videoWidth / video.videoHeight;

      let sx = 0;
      let sy = 0;
      let sw = video.videoWidth;
      let sh = video.videoHeight;

      if (sourceAR > containerAR) {
        sw = video.videoHeight * containerAR;
        sx = (video.videoWidth - sw) / 2;
      } else if (sourceAR < containerAR) {
        sh = video.videoWidth / containerAR;
        sy = (video.videoHeight - sh) / 2;
      }

      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1080;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            onCapture(canvas.toDataURL('image/jpeg', 0.9));
          };
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#1A1A1C] flex flex-col items-center justify-center overflow-hidden">
      {/* Live Camera View */}
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Camera className="w-16 h-16 text-white/20 mb-4" />
          <p className="text-white/60 mb-6 font-mono text-[10px] tracking-widest uppercase">{error}</p>
        </div>
      ) : (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            facingMode === 'user' ? "scale-x-[-1]" : ""
          )}
        />
      )}

      {/* Grid Overlay for Composition */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-1/3 border-b border-white/10" />
        <div className="w-full h-1/3 border-b border-white/10" />
        <div className="absolute top-0 bottom-0 left-1/3 w-1/3 border-l border-r border-white/10" />
      </div>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center bg-gradient-to-b from-[#0A0A0B]/80 to-transparent z-10">
        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-[10px] font-mono tracking-widest text-white/80 uppercase">PRO</span>
        </div>
        <button 
          onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 pt-24 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent flex flex-col items-center justify-center z-10">
        
        <div className="flex items-center justify-around w-full max-w-sm px-8">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ImageIcon className="w-6 h-6 text-white/60" />
          </button>
          
          <button 
            onClick={handleCapture}
            className="group relative w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center transition-transform active:scale-95"
          >
            <div className="w-16 h-16 rounded-full bg-white transition-transform group-active:scale-95" />
          </button>
          
          <div className="w-14 h-14" /> {/* Spacer to balance gallery button */}
        </div>
      </div>

      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
    </div>
  );
}

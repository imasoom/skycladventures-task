import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraViewProps {
  isRecording?: boolean;
  className?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isRecording = false,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Camera access denied:', error);
        setHasPermission(false);
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      // Cleanup camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={cn(
        "relative aspect-video rounded-2xl glass-card overflow-hidden flex items-center justify-center",
        className
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Initializing camera...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className={cn(
        "relative aspect-video rounded-2xl glass-card overflow-hidden flex items-center justify-center",
        className
      )}>
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <CameraOff className="w-12 h-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
            <p className="text-sm text-muted-foreground">
              Please allow camera access to use AI voice interactions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative aspect-video rounded-2xl overflow-hidden group",
      "glass-card border-2",
      isRecording 
        ? "border-destructive shadow-glow animate-pulse-glow" 
        : "border-accent/30 hover:border-accent/50",
      "transition-all duration-300",
      className
    )}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse-glow" />
          <span className="text-sm font-medium text-foreground bg-black/50 px-2 py-1 rounded-md">
            REC
          </span>
        </div>
      )}

      {/* Permission Status */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-md">
          <Camera className="w-4 h-4 text-success" />
          <span className="text-xs text-success font-medium">Live</span>
        </div>
      </div>

      {/* Voice Wave Visualization Overlay */}
      {isRecording && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4">
          <div className="flex items-end gap-1 h-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 bg-accent rounded-full animate-voice-wave",
                  "transition-all duration-300"
                )}
                style={{
                  height: `${Math.random() * 24 + 8}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Elegant Glow Effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
    </div>
  );
};
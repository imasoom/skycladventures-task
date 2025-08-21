import React, { useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  className?: string;
}

export type RecordingState = 'idle' | 'listening' | 'processing';

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onRecordingStart,
  onRecordingStop,
  className
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');

  const handleClick = () => {
    if (recordingState === 'idle') {
      setRecordingState('listening');
      onRecordingStart?.();
      
      // Simulate recording for demo - remove in production
      setTimeout(() => {
        setRecordingState('processing');
        setTimeout(() => {
          setRecordingState('idle');
          onRecordingStop?.();
        }, 2000);
      }, 3000);
    } else if (recordingState === 'listening') {
      setRecordingState('processing');
      setTimeout(() => {
        setRecordingState('idle');
        onRecordingStop?.();
      }, 2000);
    }
  };

  const getButtonVariant = () => {
    switch (recordingState) {
      case 'listening': return 'recording';
      case 'processing': return 'processing';
      default: return 'voice';
    }
  };

  const getIcon = () => {
    switch (recordingState) {
      case 'listening':
        return <Square className="w-6 h-6" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin" />;
      default:
        return <Mic className="w-6 h-6" />;
    }
  };

  const getAnimationClass = () => {
    switch (recordingState) {
      case 'listening': return 'animate-pulse-glow';
      case 'processing': return 'animate-breathing';
      default: return '';
    }
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="voice"
      onClick={handleClick}
      disabled={recordingState === 'processing'}
      className={cn(
        'transition-all duration-300',
        getAnimationClass(),
        className
      )}
    >
      {getIcon()}
    </Button>
  );
};
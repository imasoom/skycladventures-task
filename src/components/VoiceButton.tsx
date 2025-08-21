import React, { useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceButtonProps {
  onRecordingStart?: () => void;
  onRecordingStop?: (transcript: string) => void;
  onTranscriptChange?: (transcript: string, isInterim: boolean) => void;
  onError?: (error: string) => void;
  className?: string;
  continuousMode?: boolean;
}

export type RecordingState = 'idle' | 'listening' | 'processing';

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onRecordingStart,
  onRecordingStop,
  onTranscriptChange,
  onError,
  className,
  continuousMode = false
}) => {
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Determine recording state based on speech recognition state
  const getRecordingState = (): RecordingState => {
    if (isListening) {
      return interimTranscript || finalTranscript ? 'listening' : 'listening';
    }
    if (finalTranscript && !isListening) {
      return 'processing';
    }
    return 'idle';
  };

  const recordingState = getRecordingState();

  // Handle transcript changes - show live transcription
  useEffect(() => {
    // Use transcript (which contains final + interim) or fallback to just interim
    const currentTranscript = transcript || interimTranscript;
    console.log('VoiceButton transcript update:', { 
      transcript, 
      interimTranscript, 
      finalTranscript, 
      currentTranscript,
      isInterim: !!interimTranscript 
    });
    onTranscriptChange?.(currentTranscript, !!interimTranscript);
  }, [transcript, interimTranscript, finalTranscript, onTranscriptChange]);

  // Handle recording start callback - only call once when starting
  useEffect(() => {
    if (isListening && recordingState === 'listening') {
      console.log('VoiceButton calling onRecordingStart');
      onRecordingStart?.();
    }
  }, [isListening, onRecordingStart]); // Removed recordingState to prevent multiple calls

  // Handle auto-submit after silence (when recognition stops)
  useEffect(() => {
    if (!isListening && finalTranscript.trim()) {
      onRecordingStop?.(finalTranscript.trim());
      resetTranscript();
    }
  }, [isListening, finalTranscript, onRecordingStop, resetTranscript]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleClick = () => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    if (recordingState === 'idle') {
      resetTranscript();
      startListening(continuousMode);
    } else if (recordingState === 'listening') {
      stopListening();
    }
  };

  const getButtonVariant = () => {
    if (!isSupported || error) return 'destructive';
    if (continuousMode && isListening) return 'voice'; // Keep normal appearance in continuous mode
    switch (recordingState) {
      case 'listening': return 'recording';
      case 'processing': return 'processing';
      default: return 'voice';
    }
  };

  const getIcon = () => {
    if (!isSupported || error) {
      return <AlertCircle className="w-6 h-6" />;
    }
    switch (recordingState) {
      case 'listening':
        return continuousMode ? <Mic className="w-6 h-6" /> : <Square className="w-6 h-6" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin" />;
      default:
        return <Mic className="w-6 h-6" />;
    }
  };

  const getAnimationClass = () => {
    if (!isSupported || error) return '';
    switch (recordingState) {
      case 'listening': return 'animate-pulse-glow';
      case 'processing': return 'animate-breathing';
      default: return '';
    }
  };

  const getTooltipText = () => {
    if (!isSupported) return 'Speech recognition not supported in this browser';
    if (error) return error;
    if (continuousMode && isListening) return 'Listening continuously - use Stop Recording to end';
    switch (recordingState) {
      case 'listening': return 'Click to stop recording';
      case 'processing': return 'Processing speech...';
      default: return continuousMode ? 'Start continuous listening' : 'Click to start voice recording';
    }
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="voice"
      onClick={handleClick}
      disabled={recordingState === 'processing' || (!isSupported && recordingState === 'idle') || (continuousMode && isListening)}
      className={cn(
        'transition-all duration-300',
        getAnimationClass(),
        continuousMode && isListening && 'opacity-50',
        className
      )}
      title={getTooltipText()}
    >
      {getIcon()}
    </Button>
  );
};
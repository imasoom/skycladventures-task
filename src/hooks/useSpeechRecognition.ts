import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const endResolveRef = useRef<(() => void) | null>(null);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        
        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('Speech recognition started');
          setError(null);
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let newInterimTranscript = '';
          let newFinalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinalTranscript += transcript;
            } else {
              newInterimTranscript += transcript;
            }
          }

          setInterimTranscript(newInterimTranscript);
          if (newFinalTranscript) {
            setFinalTranscript(prev => prev + newFinalTranscript);
            setTranscript(prev => prev + newFinalTranscript);
          }
          
          // Update combined transcript
          const combinedTranscript = (finalTranscript + newFinalTranscript + newInterimTranscript).trim();
          setTranscript(combinedTranscript);
          
          // Reset timeout for auto-submit (2s of silence)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            if (isListening) {
              recognition.stop();
            }
          }, 2000); // Auto-submit after 2 seconds of silence
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
          
          // Handle specific error cases
          switch (event.error) {
            case 'not-allowed':
              setError('Microphone access denied. Please allow microphone permissions and try again.');
              break;
            case 'no-speech':
              setError('No speech detected. Please speak clearly into your microphone.');
              break;
            case 'audio-capture':
              setError('Audio capture failed. Please check your microphone connection.');
              break;
            case 'network':
              setError('Network error. Please check your internet connection.');
              break;
            case 'service-not-allowed':
              setError('Speech recognition service not allowed.');
              break;
            default:
              setError(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          setInterimTranscript('');
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Auto-restart if in continuous mode and not manually stopped
          if (recognition.continuous && !error) {
            setTimeout(() => {
              if (!isListening) {
                try {
                  recognition.start();
                } catch (restartError) {
                  console.log('Auto-restart failed, stopping continuous mode');
                }
              }
            }, 100);
          }
          
          // Allow any awaiters to continue
          endResolveRef.current?.();
          endResolveRef.current = null;
        };
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [finalTranscript, isListening]);

  const startListening = useCallback(async (continuous: boolean = false) => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognitionRef.current) {
      setError('Speech recognition not initialized.');
      return;
    }

    // Request microphone permission explicitly
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permissionError) {
      setError('Microphone access denied. Please allow microphone permissions and try again.');
      return;
    }

    if (!isListening) {
      try {
        setError(null);
        setInterimTranscript('');
        
        // Configure for continuous or single-shot mode
        if (continuous) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
        } else {
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
        }
        
        recognitionRef.current.start();
      } catch (startError) {
        console.error('Failed to start speech recognition:', startError);
        setError('Failed to start speech recognition. Please try again.');
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  return {
    transcript,
    interimTranscript,
    finalTranscript,
    isListening,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};
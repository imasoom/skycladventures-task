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
  const continuousModeRef = useRef<boolean>(false);
  const isManualStopRef = useRef<boolean>(false);

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

          // Simple stop command detection
          const fullTranscript = (finalTranscript + newFinalTranscript + newInterimTranscript).toLowerCase();
          const hasStopCommand = fullTranscript.includes('stop');
          
          if (hasStopCommand && continuousModeRef.current) {
            console.log('Stop command detected');
            // Clean transcript and stop
            const originalTranscript = finalTranscript + newFinalTranscript + newInterimTranscript;
            const cleanedTranscript = originalTranscript.replace(/stop/gi, '').trim();
            
            setFinalTranscript(cleanedTranscript);
            continuousModeRef.current = false;
            recognition.stop();
            return;
          }

          setInterimTranscript(newInterimTranscript);
          
          // Update final transcript if we have new final results
          if (newFinalTranscript) {
            setFinalTranscript(prev => prev + newFinalTranscript);
          }
          
          // Update combined transcript for live display
          setTranscript(prevTranscript => {
            const updatedFinal = finalTranscript + newFinalTranscript;
            const combined = updatedFinal + newInterimTranscript;
            console.log('Transcript update:', { 
              prevTranscript, 
              finalTranscript, 
              newFinalTranscript, 
              newInterimTranscript, 
              combined 
            });
            return combined;
          });
          
          // Reset timeout for auto-submit (2s of silence) - only in continuous mode
          if (continuousModeRef.current) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
              if (isListening && recognition) {
                console.log('2s silence timeout - stopping recognition for auto-submit');
                recognition.stop();
              }
            }, 2000); // Auto-submit after 2 seconds of silence
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          // Don't restart on aborted errors (they happen during normal stop/start cycles)
          if (event.error === 'aborted') {
            return; // Don't set error state for aborted, it's normal
          }
          
          // Stop continuous mode on real errors
          continuousModeRef.current = false;
          
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
          // But only restart after finalTranscript has been processed
          if (continuousModeRef.current && !isManualStopRef.current) {
            // Give a moment for finalTranscript processing, then restart
            setTimeout(() => {
              try {
                if (recognitionRef.current && !isListening && continuousModeRef.current) {
                  console.log('Auto-restarting speech recognition after processing...');
                  // Reset transcript state for next session
                  setFinalTranscript('');
                  setTranscript('');
                  recognitionRef.current.start();
                }
              } catch (restartError) {
                console.log('Auto-restart failed:', restartError);
                // Stop continuous mode if restart keeps failing
                continuousModeRef.current = false;
              }
            }, 1000); // Longer delay to ensure processing happens
          }
          
          // Reset manual stop flag
          isManualStopRef.current = false;
          
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
        isManualStopRef.current = false;
        continuousModeRef.current = continuous;
        
        // Configure recognition
        recognitionRef.current.continuous = continuous;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.start();
        console.log('Starting speech recognition, continuous:', continuous);
      } catch (startError) {
        console.error('Failed to start speech recognition:', startError);
        setError('Failed to start speech recognition. Please try again.');
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    isManualStopRef.current = true;
    continuousModeRef.current = false;
    
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
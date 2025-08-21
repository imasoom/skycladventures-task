import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMediaRecorderOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

interface UseMediaRecorderReturn {
  isRecording: boolean;
  recordedBlob: Blob | null;
  error: string | null;
  duration: number;
  startRecording: (stream: MediaStream) => Promise<void>;
  stopRecording: () => void;
  downloadRecording: () => void;
  clearRecording: () => void;
}

export const useMediaRecorder = (
  options: UseMediaRecorderOptions = {}
): UseMediaRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Default options
  const defaultOptions: UseMediaRecorderOptions = {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 2500000, // 2.5 Mbps
    audioBitsPerSecond: 128000,  // 128 kbps
    ...options,
  };

  // Check MediaRecorder support and get best supported MIME type
  const getSupportedMimeType = useCallback(() => {
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus', 
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    
    return 'video/webm'; // Fallback
  }, []);

  const startRecording = useCallback(async (stream: MediaStream) => {
    try {
      if (!MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      if (isRecording) {
        console.warn('Recording is already in progress');
        return;
      }

      const supportedMimeType = getSupportedMimeType();
      
      // Create MediaRecorder with best supported options
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: supportedMimeType,
      };

      // Add bitrate options if supported
      if (defaultOptions.videoBitsPerSecond) {
        mediaRecorderOptions.videoBitsPerSecond = defaultOptions.videoBitsPerSecond;
      }
      if (defaultOptions.audioBitsPerSecond) {
        mediaRecorderOptions.audioBitsPerSecond = defaultOptions.audioBitsPerSecond;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, mediaRecorderOptions);
      chunksRef.current = [];
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log('Recording stopped, creating blob');
        const blob = new Blob(chunksRef.current, { type: supportedMimeType });
        setRecordedBlob(blob);
        setIsRecording(false);
        
        // Stop duration timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError(`Recording error: ${event}`);
        setIsRecording(false);
      };

      mediaRecorderRef.current.onstart = () => {
        console.log('Recording started');
        setIsRecording(true);
        setError(null);
        startTimeRef.current = Date.now();
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setDuration((Date.now() - startTimeRef.current) / 1000);
        }, 1000);
      };
      
      // Start recording with time slices for better browser compatibility
      mediaRecorderRef.current.start(1000); // 1 second time slices
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      console.error('Recording start error:', errorMessage);
      setError(errorMessage);
      setIsRecording(false);
    }
  }, [isRecording, defaultOptions, getSupportedMimeType]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording');
      mediaRecorderRef.current.stop();
      
      // Stop all tracks in the stream to release camera/microphone
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
    }
  }, [isRecording]);
  
  const downloadRecording = useCallback(() => {
    if (recordedBlob) {
      console.log('Downloading recording, blob size:', recordedBlob.size);
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-session-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up object URL after download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      setError('No recording available to download');
    }
  }, [recordedBlob]);

  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);
  
  return {
    isRecording,
    recordedBlob,
    error,
    duration,
    startRecording,
    stopRecording,
    downloadRecording,
    clearRecording,
  };
};
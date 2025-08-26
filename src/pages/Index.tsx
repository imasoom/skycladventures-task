import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Brain, AlertCircle } from 'lucide-react';
import { VoiceButton } from '@/components/VoiceButton';
import { CameraView } from '@/components/CameraView';
import { ConversationArea, ConversationAreaRef } from '@/components/ConversationArea';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import aiTechBackground from '@/assets/ai-tech-background.jpg';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isInterimTranscript, setIsInterimTranscript] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isListeningContinuously, setIsListeningContinuously] = useState(false);
  const [forceStopListening, setForceStopListening] = useState(false);
  const conversationRef = useRef<ConversationAreaRef>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  
  const {
    isRecording: isSessionRecording,
    recordedBlob,
    error: recordingError,
    duration,
    startRecording,
    stopRecording,
    downloadRecording,
    clearRecording
  } = useMediaRecorder();

  const { isSupported: speechRecognitionSupported } = useSpeechRecognition();

  const handleRecordingStart = () => {
    setIsRecording(true);
    setCurrentTranscript('');
    setSpeechError(null);
    
    // Start session recording if not already started
    if (!sessionStarted && cameraStream) {
      handleSessionStart();
    }
  };

  const handleStartListening = () => {
    if (!isListeningContinuously) { // Only set if not already listening
      setIsListeningContinuously(true);
      setCurrentTranscript('');
      setSpeechError(null);
      
      // Start session recording if not already started
      if (!sessionStarted && cameraStream) {
        handleSessionStart();
      }
    }
  };

  const handleRecordingStop = (transcript: string) => {
    setIsRecording(false);
    
    // Simple: just submit the transcript
    if (transcript.trim()) {
      conversationRef.current?.addUserMessage(transcript.trim());
      setIsListeningContinuously(false);
      
      // Clear display
      setTimeout(() => {
        setCurrentTranscript('');
        setIsInterimTranscript(false);
      }, 500);
    }
  };

  const handleTranscriptChange = (transcript: string, isInterim: boolean) => {
    setCurrentTranscript(transcript);
    setIsInterimTranscript(isInterim);
  };

  const handleSpeechError = (error: string) => {
    setSpeechError(error);
    setIsRecording(false);
  };

  const handleSessionStart = async () => {
    if (cameraStream && !sessionStarted) {
      try {
        await startRecording(cameraStream);
        setSessionStarted(true);
      } catch (error) {
        console.error('Failed to start session recording:', error);
      }
    }
  };

  const handleSessionStop = () => {
    // Simple: submit current transcript and stop everything
    if (currentTranscript.trim()) {
      conversationRef.current?.addUserMessage(currentTranscript.trim());
    }
    
    setIsListeningContinuously(false);
    setCurrentTranscript('');
    setIsInterimTranscript(false);
    
    // Stop recording
    if (sessionStarted) {
      stopRecording();
      setSessionStarted(false);
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
  };

  const handleDownloadSession = async () => {
    // Ensure recording is finalized before downloading
    if (sessionStarted) {
      stopRecording();
      setSessionStarted(false);
    }

    // Wait briefly for blob to be composed if needed
    setTimeout(() => {
      if (recordedBlob) {
        downloadRecording();
      }
    }, 200);
  };

  // Get camera stream reference
  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: true 
        });
        setCameraStream(stream);
      } catch (error) {
        console.error('Failed to get camera stream:', error);
      }
    };

    getCameraStream();

    return () => {
      // Cleanup stream on unmount
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionStarted) {
        stopRecording();
      }
    };
  }, [sessionStarted, stopRecording]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${aiTechBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/90" />

      {/* Header */}
      <header className="relative z-10 glass-card border-b border-border/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-8 h-8 text-accent animate-float" />
                <div>
                  <h1 className="text-3xl font-bold text-gradient">Ask the AI</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Powered by Advanced Voice Recognition
                  </p>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <StatusIndicator
              connectionStatus="connected"
              microphonePermission={true}
              cameraPermission={!!cameraStream}
              isRecording={isSessionRecording || isListeningContinuously}
            />
          </div>
        </div>
      </header>

      {/* Browser Compatibility Warning */}
      {!speechRecognitionSupported && (
        <div className="relative z-10 container mx-auto px-6 py-4">
          <Alert className="border-destructive/50 text-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Speech recognition is not supported in this browser.</strong><br />
              For voice interaction features, please use <strong>Chrome, Safari, or Edge</strong>. 
              Firefox and some other browsers don't support browser-based speech recognition.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
          {/* Left Panel - Camera View */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
              <CameraView 
                isRecording={isSessionRecording || isListeningContinuously}
                className="w-full max-w-4xl"
              />
            </div>

            {/* Voice Control Section */}
            <div className="flex flex-col items-center gap-6 p-8">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold mb-2">Voice Interaction</h2>
                <p className="text-muted-foreground text-sm">
                  {!isListeningContinuously 
                    ? "Start listening - say 'stop' to submit your message"
                    : "Listening - say 'stop' to submit your message"
                  }
                </p>
              </div>

              {/* Speech Error Alert */}
              {speechError && (
                <Alert className="w-full max-w-md mx-auto border-destructive/50 text-destructive animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{speechError}</AlertDescription>
                </Alert>
              )}

              {/* Control Buttons */}
              <div className="flex gap-4 justify-center">
                <VoiceButton
                  onRecordingStart={handleStartListening}
                  onRecordingStop={handleRecordingStop}
                  onTranscriptChange={handleTranscriptChange}
                  onError={handleSpeechError}
                  className={`shadow-glow ${isListeningContinuously ? 'hidden' : ''}`}
                  continuousMode={true}
                  forceStop={forceStopListening}
                />
                {isListeningContinuously && (
                  <Button
                    variant="destructive"
                    size="voice"
                    onClick={handleSessionStop}
                    className="shadow-glow animate-pulse-glow"
                  >
                    Stop Recording
                  </Button>
                )}
              </div>

              {/* Live Transcript Display */}
              {isListeningContinuously && (
                <div className="text-center animate-fade-in w-full max-w-lg">
                  <p className="text-accent font-medium mb-2">
                    {isRecording ? 'Listening...' : 'Ready to listen'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Speak naturally - your words will appear below. Say "stop" to submit your message.
                  </p>
                  
                  <div className="glass-card p-4 rounded-lg border border-accent/20 min-h-[100px]">
                    <p className="text-sm text-muted-foreground mb-2">Live Transcription:</p>
                    {currentTranscript ? (
                      <p className={`text-sm ${isInterimTranscript ? 'text-accent/70 italic' : 'text-foreground font-medium'}`}>
                        "{currentTranscript}"
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Start speaking to see your words appear here...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Conversation Area */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <ConversationArea 
              ref={conversationRef} 
              className="h-full flex-1" 
              onDownloadSession={handleDownloadSession}
              sessionRecording={isSessionRecording || isListeningContinuously}
              sessionDuration={duration}
            />
          </div>
        </div>
      </main>

      {/* Floating Elements */}
      <div className="fixed top-1/4 left-8 w-2 h-2 bg-accent rounded-full opacity-30 animate-float" 
           style={{ animationDelay: '0s' }} />
      <div className="fixed top-1/3 right-12 w-3 h-3 bg-primary rounded-full opacity-20 animate-float" 
           style={{ animationDelay: '2s' }} />
      <div className="fixed bottom-1/4 left-16 w-1 h-1 bg-accent rounded-full opacity-40 animate-float" 
           style={{ animationDelay: '4s' }} />
    </div>
  );
};

export default Index;
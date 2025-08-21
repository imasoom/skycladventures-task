import React, { useState } from 'react';
import { Sparkles, Brain } from 'lucide-react';
import { VoiceButton } from '@/components/VoiceButton';
import { CameraView } from '@/components/CameraView';
import { ConversationArea } from '@/components/ConversationArea';
import { StatusIndicator } from '@/components/StatusIndicator';
import aiTechBackground from '@/assets/ai-tech-background.jpg';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordingStart = () => {
    setIsRecording(true);
    console.log('Recording started');
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
    console.log('Recording stopped');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
              cameraPermission={true}
              isRecording={isRecording}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[calc(100vh-200px)]">
          {/* Left Panel - Camera View */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
              <CameraView 
                isRecording={isRecording}
                className="w-full max-w-4xl"
              />
            </div>

            {/* Voice Control Section */}
            <div className="flex flex-col items-center gap-6 p-8">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold mb-2">Voice Interaction</h2>
                <p className="text-muted-foreground text-sm">
                  Click the microphone to start speaking with AI
                </p>
              </div>

              <VoiceButton
                onRecordingStart={handleRecordingStart}
                onRecordingStop={handleRecordingStop}
                className="shadow-glow"
              />

              {isRecording && (
                <div className="text-center animate-fade-in">
                  <p className="text-accent font-medium mb-1">Listening...</p>
                  <p className="text-sm text-muted-foreground">
                    Speak clearly into your microphone
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Conversation Area */}
          <div className="lg:col-span-2">
            <ConversationArea className="h-full" />
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
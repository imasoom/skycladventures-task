import React from 'react';
import { Wifi, WifiOff, Mic, MicOff, Video, VideoOff, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  microphonePermission?: boolean;
  cameraPermission?: boolean;
  isRecording?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  connectionStatus = 'connected',
  microphonePermission = true,
  cameraPermission = true,
  isRecording = false,
  className
}) => {
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-success" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-warning animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-destructive" />;
      default:
        return <Wifi className="w-4 h-4 text-success" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Connected';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-success';
      case 'connecting':
        return 'text-warning';
      case 'disconnected':
        return 'text-destructive';
      default:
        return 'text-success';
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Connection Status */}
      <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg">
        {getConnectionIcon()}
        <span className={cn("text-sm font-medium", getConnectionColor())}>
          {getConnectionText()}
        </span>
      </div>

      {/* Camera Permission */}
      <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg">
        {cameraPermission ? (
          <Video className="w-4 h-4 text-success" />
        ) : (
          <VideoOff className="w-4 h-4 text-destructive" />
        )}
        <span className={cn(
          "text-sm font-medium",
          cameraPermission ? "text-success" : "text-destructive"
        )}>
          Camera
        </span>
      </div>

      {/* Microphone Permission */}
      <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg">
        {microphonePermission ? (
          <Mic className="w-4 h-4 text-success" />
        ) : (
          <MicOff className="w-4 h-4 text-destructive" />
        )}
        <span className={cn(
          "text-sm font-medium",
          microphonePermission ? "text-success" : "text-destructive"
        )}>
          Microphone
        </span>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg border border-destructive/30">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse-glow" />
          <span className="text-sm font-medium text-destructive">Recording</span>
        </div>
      )}

      {/* Security Indicator */}
      <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg">
        <Shield className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium text-accent">Secure</span>
      </div>
    </div>
  );
};
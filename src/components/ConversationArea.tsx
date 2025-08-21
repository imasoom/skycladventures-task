import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Bot, User, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ConversationAreaProps {
  className?: string;
  onDownloadSession?: () => void;
  sessionRecording?: boolean;
  sessionDuration?: number;
}

export interface ConversationAreaRef {
  addUserMessage: (content: string) => void;
}

export const ConversationArea = forwardRef<ConversationAreaRef, ConversationAreaProps>(({ 
  className, 
  onDownloadSession, 
  sessionRecording = false, 
  sessionDuration = 0 
}, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant. I can see and hear you through the camera and microphone. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [sessionStats, setSessionStats] = useState({
    duration: '00:00',
    questionsAsked: 0,
    connectionQuality: 'Excellent'
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Simulate session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionStats(prev => {
        const [minutes, seconds] = prev.duration.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds + 1;
        const newMinutes = Math.floor(totalSeconds / 60);
        const newSeconds = totalSeconds % 60;
        return {
          ...prev,
          duration: `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addUserMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setSessionStats(prev => ({ ...prev, questionsAsked: prev.questionsAsked + 1 }));

    // Simulate AI typing response
    setTimeout(() => {
      const aiTypingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '',
        timestamp: new Date(),
        isTyping: true
      };
      setMessages(prev => [...prev, aiTypingMessage]);

      // Replace typing message with actual response
      setTimeout(() => {
        const responses = [
          "That's an interesting question! Based on what I can see and hear, let me provide you with a detailed response...",
          "I understand your query. From the visual and audio context, here's what I think would be most helpful...",
          "Great question! Let me analyze what I'm observing through the camera and microphone to give you the best answer...",
          "I can see you're looking for guidance on this topic. Based on our conversation so far, here's my recommendation..."
        ];
        
        const aiResponse: Message = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date()
        };

        setMessages(prev => prev.filter(msg => !msg.isTyping).concat(aiResponse));
      }, 2000);
    }, 500);
  };

  // Expose addUserMessage function through ref
  useImperativeHandle(ref, () => ({
    addUserMessage
  }));

  const handleDownload = () => {
    if (onDownloadSession) {
      onDownloadSession();
    } else {
      // Fallback: download conversation transcript
      const transcript = messages
        .filter(msg => !msg.isTyping)
        .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
        .join('\n\n');
      
      const blob = new Blob([transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-transcript-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
    <div className={cn(
      "flex gap-3 mb-6",
      message.type === 'user' ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        message.type === 'user' 
          ? "bg-gradient-primary text-primary-foreground" 
          : "bg-accent text-accent-foreground"
      )}>
        {message.type === 'user' ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        message.type === 'user' ? "flex justify-end" : "flex justify-start"
      )}>
        <div className={cn(
          "px-4 py-3 rounded-2xl",
          message.type === 'user'
            ? "bg-gradient-primary text-primary-foreground rounded-tr-md"
            : "glass-card text-foreground rounded-tl-md"
        )}>
          {message.isTyping ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="mt-2 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="glass-card p-4 mb-4 rounded-2xl">
        <h2 className="text-lg font-semibold mb-2">Conversation</h2>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Duration: {sessionDuration ? `${Math.floor(sessionDuration / 60).toString().padStart(2, '0')}:${(sessionDuration % 60).toFixed(0).padStart(2, '0')}` : sessionStats.duration}</span>
          <span>Questions: {sessionStats.questionsAsked}</span>
          <span className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              sessionRecording ? "bg-destructive animate-pulse" : "bg-success"
            )} />
            {sessionRecording ? "Recording" : sessionStats.connectionQuality}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 glass-card rounded-2xl p-4">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="pr-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="glass border-accent/30 hover:border-accent/50"
        >
          <Download className="w-4 h-4 mr-2" />
          {onDownloadSession ? "Download Recording" : "Download Transcript"}
        </Button>
        
        <div className="flex-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addUserMessage("This is a demo user question to test the conversation flow.")}
          className="text-accent hover:text-accent-foreground hover:bg-accent/10"
        >
          Demo Message
        </Button>
      </div>
    </div>
  );
});

ConversationArea.displayName = 'ConversationArea';
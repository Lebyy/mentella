'use client';

import { useEffect, useRef, useState } from 'react';

interface AvatarPlayerProps {
  sessionToken: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onUserSpeak?: (text: string) => void;
  onAvatarSpeak?: (text: string) => void;
  autoStartMessage?: string;
  onSessionCreated?: (session: any) => void;
}

export default function AvatarPlayer({ 
  sessionToken, 
  onReady, 
  onError,
  onUserSpeak,
  onAvatarSpeak,
  autoStartMessage,
  onSessionCreated
}: AvatarPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasAutoStarted = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip if already initialized (prevents re-init on state changes)
    if (hasInitialized.current) {
      console.log('✅ Session already initialized, skipping');
      return;
    }
    
    let mounted = true;

    const initializeAvatar = async () => {
      try {
        // Dynamically import the SDK to avoid SSR issues
        const { LiveAvatarSession, AgentEventsEnum, SessionEvent } = await import('@heygen/liveavatar-web-sdk');

        if (!mounted) return;

        // Create session with voice chat enabled
        const session = new LiveAvatarSession(sessionToken, {
          voiceChat: true,
        });

        sessionRef.current = session;
        hasInitialized.current = true;
        
        // Pass session reference to parent
        if (onSessionCreated) {
          onSessionCreated(session);
        }

        // Log ALL possible events for debugging
        console.log('🔍 Setting up event listeners for all possible events...');
        
        // Listen to the correct events that contain text
        (session as any).on('user.transcription', (data: any) => {
          console.log('✅ USER TEXT:', data.text);
          if (data.text && onUserSpeak) {
            onUserSpeak(data.text);
          }
        });
        
        (session as any).on('avatar.transcription', (data: any) => {
          console.log('✅ AVATAR TEXT:', data.text);
          if (data.text && onAvatarSpeak) {
            onAvatarSpeak(data.text);
          }
        });

        // Listen for stream ready event
        session.on(SessionEvent.SESSION_STREAM_READY, async () => {
          if (videoRef.current) {
            session.attach(videoRef.current);
            setIsLoading(false);
            onReady?.();
            
            // Send auto-start message to LiveAvatar if provided and not already sent
            if (autoStartMessage && !hasAutoStarted.current) {
              hasAutoStarted.current = true;
              setTimeout(async () => {
                try {
                  // Trigger avatar to speak by sending user input
                  // The avatar will respond based on the context's opening_text
                  await (session as any).speakText?.(autoStartMessage) || 
                        (session as any).speak?.({ text: autoStartMessage }) ||
                        (session as any).interrupt?.({ text: autoStartMessage });
                  
                  console.log('Auto-start message sent to avatar:', autoStartMessage);
                  
                  // Also trigger the callback to show in transcript
                  if (onUserSpeak) {
                    onUserSpeak(autoStartMessage);
                  }
                } catch (err) {
                  console.error('Error sending auto-start message:', err);
                  // Fallback: just add to transcript
                  if (onUserSpeak) {
                    onUserSpeak(autoStartMessage);
                  }
                }
              }, 1500); // 1.5 second delay to ensure session is fully ready
            }
          }
        });

        // Start the session
        await session.start();
      } catch (error) {
        console.error('Error initializing avatar:', error);
        setIsLoading(false);
        onError?.(error as Error);
      }
    };

    initializeAvatar();

    return () => {
      mounted = false;
      // Don't stop session on cleanup - it causes re-initialization
      // Session will be stopped when component fully unmounts
    };
  }, [sessionToken]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Connecting to avatar...</p>
          </div>
        </div>
      )}
    </div>
  );
}

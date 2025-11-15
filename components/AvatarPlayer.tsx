'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardBody, Spinner, Chip } from '@heroui/react';

interface AvatarPlayerProps {
  sessionId: string | null;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export default function AvatarPlayer({ sessionId, onReady, onError }: AvatarPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Initialize WebRTC connection for LiveAvatar
    const initializeAvatar = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // This is a simplified WebRTC setup
        // In production, you'll need to implement full WebRTC signaling
        // based on LiveAvatar's documentation
        
        if (videoRef.current) {
          // Placeholder for WebRTC setup
          // You'll need to:
          // 1. Get ICE servers from session data
          // 2. Create RTCPeerConnection
          // 3. Set up media streams
          // 4. Handle signaling
          
          setIsLoading(false);
          onReady?.();
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to initialize avatar';
        setError(errorMessage);
        onError?.(errorMessage);
        setIsLoading(false);
      }
    };

    initializeAvatar();
  }, [sessionId, onReady, onError]);

  if (error) {
    return (
      <Card className="bg-red-50 border-2 border-red-200">
        <CardBody className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-700 font-semibold text-lg mb-2">Avatar Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-blue-50 border-2 border-blue-200">
        <CardBody className="text-center p-8">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-blue-700 font-semibold">Loading Avatar...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-0 relative">
        <div className="relative w-full aspect-video bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4">
            <Chip color="success" variant="flat">
              🟢 Live
            </Chip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

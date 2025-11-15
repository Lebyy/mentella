'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button, Spinner, Textarea } from '@nextui-org/react';
import dynamic from 'next/dynamic';

// Lazy load AvatarPlayer to reduce initial bundle
const AvatarPlayer = dynamic(() => import('@/components/AvatarPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="text-center text-white">
        <Spinner size="lg" color="primary" className="mb-4" />
        <p className="text-xl font-semibold">Loading AI Avatar...</p>
      </div>
    </div>
  ),
});

const ASSESSMENT_TYPES: Record<string, { title: string; duration: string }> = {
  cardiovascular: { title: 'Cardiovascular Health', duration: '20-25 minutes' },
  neurological: { title: 'Neurological Screening', duration: '15-20 minutes' },
  'full-health': { title: 'Full Health Screening', duration: '45-50 minutes' },
  respiratory: { title: 'Respiratory Function', duration: '15-20 minutes' },
  psychometric: { title: 'Psychometric Test', duration: '30-35 minutes' },
  therapy: { title: 'Mental Health Therapy', duration: '40-45 minutes' },
};

interface Message {
  speaker: 'user' | 'avatar';
  message: string;
  timestamp: Date;
  type: 'voice' | 'text';
}

export default function SessionPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [avatarSessionToken, setAvatarSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [avatarLiveSessionId, setAvatarLiveSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartedRef = useRef(false);
  const initialHeyMsgSentRef = useRef(false);
  const avatarSessionRef = useRef<any>(null);

  const assessmentType = searchParams.get('type') || 'therapy';
  const sessionInfo = ASSESSMENT_TYPES[assessmentType] || ASSESSMENT_TYPES.therapy;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Clear any old session data on every visit (disable refresh protection)
    localStorage.removeItem('activeSessionId');
    localStorage.removeItem('activeAvatarToken');
    localStorage.removeItem('activeSessionMessages');
    localStorage.removeItem('activeSessionType');

    // Prevent double execution in React Strict Mode
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;

    // Always start fresh session
    startSession();
    
    // Cleanup keep-alive interval on unmount
    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };
  }, []);

  // Don't save session state to localStorage (refresh protection disabled)
  // Removed useEffect for saving sessionId, avatarSessionToken, messages

  // Removed beforeunload warning (refresh protection disabled)

  const startSession = async () => {
    setLoading(true);

    try {
      let userId = null;

      if (user) {
        const userResponse = await fetch(`/api/users?clerkId=${user.id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.user?._id;
        } else {
          const createResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: user.id,
              name: user.fullName || user.firstName || 'User',
              email: user.primaryEmailAddress?.emailAddress || '',
            }),
          });
          if (createResponse.ok) {
            const newUserData = await createResponse.json();
            userId = newUserData.user._id;
          }
        }
      }

      if (!userId) {
        throw new Error('Unable to get user ID. Please sign in.');
      }

      // Create therapy/assessment session
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          sessionType: assessmentType,
          metadata: {
            assessmentType,
            startTime: new Date().toISOString(),
          },
        }),
      });

      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.session._id);

      // Start avatar session
      const avatarResponse = await fetch('/api/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          sessionType: assessmentType,
          avatarId: '1c690fe7-23e0-49f9-bfba-14344450285b', // Santa Fireplace Front
        }),
      });

      const avatarData = await avatarResponse.json();
      setAvatarSessionToken(avatarData.sessionToken);
      
      // Store the LiveAvatar session ID for keep-alive
      if (avatarData.sessionId) {
        setAvatarLiveSessionId(avatarData.sessionId);
        
        // Start keep-alive interval (every 30 seconds)
        const keepAliveInterval = setInterval(() => {
          fetch('/api/avatar/keep-alive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: avatarData.sessionId }),
          }).catch(err => {
            console.error('Keep-alive failed:', err);
          });
        }, 30000); // 30 seconds
        
        keepAliveIntervalRef.current = keepAliveInterval;
      }

      // Add virtual "Hey!" message from user to trigger avatar response
      const initialUserMsg: Message = {
        speaker: 'user',
        message: 'Hey!',
        timestamp: new Date(),
        type: 'voice',
      };
      setMessages([initialUserMsg]);

      // Save to session
      if (sessionData.session._id) {
        fetch(`/api/sessions/${sessionData.session._id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Hey!', speaker: 'user' }),
        }).catch(console.error);
      }

    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSpeak = useCallback((text: string) => {
    // Skip the initial "Hey!" message from auto-start (already added in startSession)
    if (text === 'Hey!' && !initialHeyMsgSentRef.current) {
      initialHeyMsgSentRef.current = true;
      return;
    }
    
    const voiceMsg: Message = {
      speaker: 'user',
      message: text,
      timestamp: new Date(),
      type: 'voice',
    };
    setMessages(prev => [...prev, voiceMsg]);
    
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, speaker: 'user' }),
      }).catch(console.error);
    }
  }, [sessionId]);

  const handleAvatarSpeak = useCallback((text: string) => {
    const voiceMsg: Message = {
      speaker: 'avatar',
      message: text,
      timestamp: new Date(),
      type: 'voice',
    };
    setMessages(prev => [...prev, voiceMsg]);
    
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, speaker: 'avatar' }),
      }).catch(console.error);
    }
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !sessionId) return;

    const userMsg: Message = {
      speaker: 'user',
      message: inputMessage,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.message, speaker: 'user' }),
      });

      const data = await response.json();

      if (data.aiResponse) {
        const avatarMsg: Message = {
          speaker: 'avatar',
          message: data.aiResponse,
          timestamp: new Date(),
          type: 'text',
        };
        setMessages(prev => [...prev, avatarMsg]);
        
        // Note: Text messages through avatar handled by SDK
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    
    // Stop LiveAvatar session
    if (avatarSessionRef.current) {
      try {
        await avatarSessionRef.current.stop();
        avatarSessionRef.current = null;
      } catch (err) {
        console.error('Error stopping avatar session:', err);
      }
    }
    
    // Clear keep-alive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: 'Completed' }),
      });

      const data = await response.json();

      if (data.assessment) {
        // Store assessment results in localStorage to show on dashboard
        localStorage.setItem('latestAssessment', JSON.stringify({
          type: assessmentType,
          score: data.assessment.score,
          insights: data.assessment.insights,
          recommendations: data.assessment.recommendations,
          detectedConditions: data.assessment.detectedConditions,
          riskLevel: data.assessment.riskLevel,
          completedAt: new Date().toISOString(),
        }));
      }

      if (data.persona?.updated) {
        // Store persona update flag
        localStorage.setItem('personaUpdated', 'true');
      }

      // Clear active session from localStorage
      localStorage.removeItem('activeSessionId');
      localStorage.removeItem('activeAvatarToken');
      localStorage.removeItem('activeSessionMessages');
      localStorage.removeItem('activeSessionType');

      router.push('/dashboard');
    } catch (error) {
      console.error('Error ending session:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-xl font-semibold">
            Initializing Session...
          </p>
          <p className="text-sm text-blue-200 mt-2">
            Setting up your {sessionInfo.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex">
      {/* Left Side - Avatar Video (60%) */}
      <div className="w-[60%] relative">
        {avatarSessionToken ? (
          <AvatarPlayer
            key={avatarSessionToken}
            sessionToken={avatarSessionToken}
            onReady={() => console.log('Avatar ready')}
            onError={(err) => console.error('Avatar error:', err)}
            onUserSpeak={handleUserSpeak}
            onAvatarSpeak={handleAvatarSpeak}
            autoStartMessage="Hey!"
            onSessionCreated={(session) => {
              avatarSessionRef.current = session;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            <div className="text-center text-white">
              <Spinner size="lg" color="primary" className="mb-4" />
              <p className="text-xl font-semibold">Loading AI Avatar...</p>
            </div>
          </div>
        )}

        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 to-transparent">
          <div className="text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{sessionInfo.title}</h1>
                <p className="text-sm text-gray-300 mt-1">{sessionInfo.duration} • Insurance Compliant</p>
              </div>
              {messages.length > 1 && (
                <div className="text-xs bg-green-500/20 text-green-200 px-3 py-1 rounded-full border border-green-500/30">
                  ✓ Session Active
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex justify-end">
            <Button
              onClick={handleEndSession}
              color="danger"
              size="lg"
              className="font-semibold"
            >
              Complete Session
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Chat Panel (40%) */}
      <div className="w-[40%] bg-white flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Session Transcript</h2>
          <p className="text-xs text-gray-500 mt-1">🎤 Voice or 💬 Type your responses</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.speaker === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  {msg.type === 'voice' && (
                    <span className="text-xs">🎤</span>
                  )}
                  <p className="text-sm leading-relaxed flex-1">{msg.message}</p>
                </div>
                <p
                  className={`text-xs ${
                    msg.speaker === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <Textarea
              value={inputMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              minRows={2}
              maxRows={4}
              isDisabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              isDisabled={!inputMessage.trim() || isSending}
              color="primary"
              size="lg"
              className="self-end font-semibold"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

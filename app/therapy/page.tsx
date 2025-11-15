'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AvatarPlayer from '@/components/AvatarPlayer';
import TherapyChat from '@/components/TherapyChat';
import { Card, CardBody, Button, Spinner, RadioGroup, Radio } from '@heroui/react';

export default function TherapyPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [avatarSessionId, setAvatarSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [mood, setMood] = useState('');
  const router = useRouter();

  const startSession = async () => {
    setLoading(true);

    try {
      // For demo purposes, create a default user if none exists
      // In production, you'd check authentication
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Demo User',
          email: 'demo@mentella.com',
        }),
      });

      const userData = await userResponse.json();
      const userId = userData.user._id;

      // Start therapy session
      const sessionResponse = await fetch('/api/therapy/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionType: 'general' }),
      });

      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.session._id);

      // Initialize avatar session
      const avatarResponse = await fetch('/api/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const avatarData = await avatarResponse.json();
      setAvatarSessionId(avatarData.sessionData.sessionId);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string): Promise<string | null> => {
    if (!sessionId) return null;

    try {
      const response = await fetch(`/api/therapy/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, speaker: 'user' }),
      });

      const data = await response.json();

      // Send AI response to avatar to speak
      if (data.aiResponse && avatarSessionId) {
        await fetch('/api/avatar/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: avatarSessionId,
            text: data.aiResponse,
          }),
        });
      }

      return data.aiResponse;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    setShowMoodForm(true);
  };

  const handleMoodSubmit = async () => {
    if (!sessionId) return;

    setLoading(true);

    try {
      await fetch(`/api/therapy/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });

      router.push('/');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session properly.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startSession();
  }, []);

  if (showMoodForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardBody className="p-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Complete</h2>
            <p className="text-gray-600 mb-6">How are you feeling after this session?</p>

            <RadioGroup
              value={mood}
              onValueChange={setMood}
              className="mb-6"
            >
              {['Great', 'Good', 'Neutral', 'Anxious', 'Stressed'].map((moodOption) => (
                <Radio key={moodOption} value={moodOption}>
                  {moodOption}
                </Radio>
              ))}
            </RadioGroup>

            <Button
              onClick={handleMoodSubmit}
              isDisabled={!mood || loading}
              color="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 font-semibold"
            >
              {loading ? <><Spinner size="sm" color="white" className="mr-2" /> Saving...</> : 'Complete Session'}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Therapy Session</h1>
            <p className="text-gray-600">Talk to Mentella, your AI companion</p>
          </div>
          <Button
            onClick={handleEndSession}
            color="danger"
            variant="solid"
            size="lg"
          >
            End Session
          </Button>
        </div>

        {loading && !sessionId ? (
          <Card className="shadow-lg">
            <CardBody className="flex items-center justify-center py-32">
              <Spinner size="lg" color="primary" className="mb-4" />
              <p className="text-gray-600 font-semibold">Starting your session...</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Avatar Player */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Video Avatar</h2>
              <div className="aspect-video">
                <AvatarPlayer
                  sessionId={avatarSessionId}
                  onReady={() => console.log('Avatar ready')}
                  onError={(error) => console.error('Avatar error:', error)}
                />
              </div>
            </div>

            {/* Chat Interface */}
            <div className="h-[600px]">
              {sessionId && (
                <TherapyChat sessionId={sessionId} onSendMessage={handleSendMessage} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

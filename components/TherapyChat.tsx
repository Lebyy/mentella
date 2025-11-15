'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Button, Textarea, Chip, Spinner } from '@nextui-org/react';

interface Message {
  speaker: 'user' | 'avatar';
  message: string;
  timestamp: Date;
  type?: 'voice' | 'text';
}

interface TherapyChatProps {
  sessionId: string;
  onSendMessage: (message: string) => Promise<string | null>;
  initialMessages?: Message[];
  onAddMessage?: (message: Message) => void;
}

export default function TherapyChat({ sessionId, onSendMessage, initialMessages = [], onAddMessage }: TherapyChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  // Expose addMessage function to parent
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    onAddMessage?.(message);
  };
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      speaker: 'user',
      message: inputMessage,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await onSendMessage(inputMessage);
      
      if (aiResponse) {
        const avatarMessage: Message = {
          speaker: 'avatar',
          message: aiResponse,
          timestamp: new Date(),
        };
        addMessage(avatarMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-lg">
      {/* Chat Header */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div>
          <h3 className="text-lg font-semibold">Therapy Session</h3>
          <p className="text-sm text-blue-100">Your AI companion is here to listen</p>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardBody className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-semibold mb-2">Welcome to your therapy session</p>
            <p className="text-sm">Feel free to share what's on your mind...</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
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

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardBody>

      {/* Input Area */}
      <CardFooter className="border-t border-gray-200">
        <div className="flex w-full gap-3">
          <Textarea
            value={inputMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts..."
            minRows={2}
            maxRows={4}
            variant="bordered"
            isDisabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            isDisabled={!inputMessage.trim() || isLoading}
            color="primary"
            size="lg"
            className="self-end font-semibold"
          >
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

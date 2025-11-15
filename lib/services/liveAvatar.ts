import axios from 'axios';

const LIVEAVATAR_API_KEY = process.env.LIVEAVATAR_API_KEY;
const LIVEAVATAR_API_URL = 'https://api.liveavatar.com/v1';

if (!LIVEAVATAR_API_KEY) {
  console.warn('LIVEAVATAR_API_KEY is not set in environment variables');
}

export interface LiveAvatarConfig {
  avatarId?: string;
  voice?: string;
  language?: string;
}

export interface StreamingSessionData {
  sessionId: string;
  iceServers: any[];
  offer: string;
}

class LiveAvatarService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = LIVEAVATAR_API_KEY || '';
    this.baseUrl = LIVEAVATAR_API_URL;
  }

  /**
   * Create a new streaming session with LiveAvatar
   */
  async createStreamingSession(config?: LiveAvatarConfig): Promise<StreamingSessionData> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/streaming/new`,
        {
          avatar_id: config?.avatarId || 'default',
          voice: config?.voice || 'en-US-Standard-A',
          language: config?.language || 'en-US',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating LiveAvatar session:', error);
      throw new Error('Failed to create avatar streaming session');
    }
  }

  /**
   * Send text to the avatar to speak
   */
  async sendTextToSpeak(sessionId: string, text: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/streaming/speak`,
        {
          session_id: sessionId,
          text: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error sending text to avatar:', error);
      throw new Error('Failed to send text to avatar');
    }
  }

  /**
   * Close the streaming session
   */
  async closeSession(sessionId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/streaming/close`,
        {
          session_id: sessionId,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error closing LiveAvatar session:', error);
      throw new Error('Failed to close avatar session');
    }
  }

  /**
   * List available avatars
   */
  async listAvatars(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/avatars`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data.avatars || [];
    } catch (error) {
      console.error('Error fetching avatars:', error);
      return [];
    }
  }
}

export default new LiveAvatarService();

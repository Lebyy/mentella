import axios from 'axios';
import dbConnect from '@/lib/mongodb';
import { AppConfig } from '@/models/AppConfig';

const LIVEAVATAR_API_URL = 'https://api.liveavatar.com/v1';

/**
 * Fetch LiveAvatar API key from database, fallback to env variable
 */
async function getLiveAvatarApiKey(): Promise<string> {
  try {
    await dbConnect();
    const config = await AppConfig.findOne({ key: 'LIVEAVATAR_API_KEY' });
    
    if (config?.value) {
      return config.value;
    }
  } catch (error) {
    console.warn('Failed to fetch API key from database, using env fallback:', error);
  }
  
  // Fallback to environment variable
  return process.env.LIVEAVATAR_API_KEY || '';
}

export interface LiveAvatarConfig {
  avatarId?: string;
  voice?: string;
  language?: string;
  contextId?: string;
}

export interface ContextConfig {
  systemPrompt: string;
  sessionType: string;
}

export interface StreamingSessionData {
  sessionId: string;
  iceServers: any[];
  offer: string;
}

class LiveAvatarService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = LIVEAVATAR_API_URL;
  }

  private async getApiKey(): Promise<string> {
    return await getLiveAvatarApiKey();
  }

  /**
   * Create a context for the avatar with system prompt
   */
  async createContext(config: ContextConfig): Promise<string> {
    try {
      const apiKey = await this.getApiKey();
      const response = await axios.post(
        `${this.baseUrl}/contexts`,
        {
          system_prompt: config.systemPrompt,
          metadata: {
            session_type: config.sessionType,
          },
        },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.context_id || response.data.data?.context_id;
    } catch (error) {
      console.error('Error creating context:', error);
      throw new Error('Failed to create avatar context');
    }
  }

  /**
   * Create a new streaming session with LiveAvatar
   */
  async createStreamingSession(config?: LiveAvatarConfig): Promise<StreamingSessionData> {
    try {
      const apiKey = await this.getApiKey();
      const response = await axios.post(
        `${this.baseUrl}/sessions/token`,
        {
          avatar_id: config?.avatarId || 'default',
          voice: config?.voice || 'en-US-Standard-A',
          language: config?.language || 'en-US',
          context_id: config?.contextId,
        },
        {
          headers: {
            'x-api-key': apiKey,
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
      const apiKey = await this.getApiKey();
      await axios.post(
        `${this.baseUrl}/streaming/speak`,
        {
          session_id: sessionId,
          text: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
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
      const apiKey = await this.getApiKey();
      await axios.post(
        `${this.baseUrl}/streaming/close`,
        {
          session_id: sessionId,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
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
      const apiKey = await this.getApiKey();
      const response = await axios.get(`${this.baseUrl}/avatars`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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

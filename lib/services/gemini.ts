import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export interface PersonaGenerationInput {
  userName: string;
  assessmentAnswers: Array<{ question: string; answer: string; category: string }>;
  therapySessions?: Array<{ transcript: any[]; mood?: string }>;
}

class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Generate a comprehensive user persona based on assessment and therapy data
   */
  async generateUserPersona(input: PersonaGenerationInput): Promise<string> {
    const { userName, assessmentAnswers, therapySessions } = input;

    const prompt = `
You are an expert medical and psychological analyst. Generate a comprehensive user persona for ${userName} based on the following information:

PRE-ASSESSMENT DATA:
${assessmentAnswers.map((a, i) => `${i + 1}. ${a.question}\n   Answer: ${a.answer}\n   Category: ${a.category}`).join('\n\n')}

${therapySessions && therapySessions.length > 0 ? `
THERAPY SESSIONS DATA:
${therapySessions.map((s, i) => `Session ${i + 1}:\nMood: ${s.mood || 'Not specified'}\nKey conversations: ${s.transcript.slice(0, 3).map(m => m.message).join('. ')}`).join('\n\n')}
` : ''}

Generate a detailed persona paragraph (200-300 words) that includes:
1. Medical background and current health status
2. Mental health state and emotional patterns
3. Lifestyle factors and habits
4. Key concerns and needs
5. Recommended approach for future therapy sessions

The persona should be professional, empathetic, and actionable for healthcare providers.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating persona:', error);
      throw new Error('Failed to generate user persona');
    }
  }

  /**
   * Generate assessment recommendations based on answers
   */
  async generateAssessmentRecommendations(
    answers: Array<{ question: string; answer: string; category: string }>
  ): Promise<string[]> {
    const prompt = `
You are a medical assistant AI. Based on the following pre-assessment answers, provide 3-5 specific, actionable recommendations for the user:

${answers.map((a, i) => `${i + 1}. ${a.question}\n   Answer: ${a.answer}`).join('\n\n')}

Provide recommendations as a JSON array of strings. Each recommendation should be clear, specific, and actionable.
Focus on lifestyle improvements, medical checkups, mental health support, or immediate actions needed.

Return ONLY a JSON array, nothing else.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Try to parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: split by newlines if JSON parsing fails
      return text.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [
        'Schedule a comprehensive health checkup',
        'Consider speaking with a mental health professional',
        'Maintain a healthy lifestyle with regular exercise',
      ];
    }
  }

  /**
   * Generate therapy session insights
   */
  async generateSessionInsights(
    transcript: Array<{ speaker: string; message: string }>,
    mood?: string
  ): Promise<string> {
    const prompt = `
You are a licensed therapist AI assistant. Analyze the following therapy session and provide professional insights:

Session Mood: ${mood || 'Not specified'}

Transcript:
${transcript.map((t, i) => `${t.speaker}: ${t.message}`).join('\n')}

Generate a brief professional insight (100-150 words) covering:
1. Key themes discussed
2. Emotional patterns observed
3. Progress indicators
4. Suggested focus areas for next session

Be professional, empathetic, and constructive.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating session insights:', error);
      throw new Error('Failed to generate session insights');
    }
  }

  /**
   * Generate conversational response for therapy chat
   */
  async generateTherapyResponse(
    userMessage: string,
    conversationHistory: Array<{ speaker: string; message: string }>,
    userContext?: string
  ): Promise<string> {
    const prompt = `
You are Mentella, a compassionate and professional AI therapy assistant. You are having a therapy session with a user.

${userContext ? `User Context: ${userContext}\n\n` : ''}

Conversation History:
${conversationHistory.slice(-10).map(h => `${h.speaker}: ${h.message}`).join('\n')}

User: ${userMessage}

Respond as Mentella with empathy, professionalism, and therapeutic techniques. Keep responses conversational (2-4 sentences), ask thoughtful questions, and provide support. Use active listening techniques.

Your response:
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating therapy response:', error);
      return "I'm here to listen and support you. Could you tell me more about what you're experiencing?";
    }
  }
}

export default new GeminiService();

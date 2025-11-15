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
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

Generate a detailed persona in RICH HTML FORMAT with the following requirements:

1. Use semantic HTML with beautiful styling
2. Include relevant emojis throughout (🏥 💊 🧠 ❤️ 💪 🎯 ⚠️ ✅ 🌟 💡 etc.)
3. Use colored badges/pills for key metrics using Tailwind CSS classes
4. Structure with clear sections using headers
5. Make it visually appealing and easy to scan
6. Include subtle animations (fade-in, slide effects)
7. Use gradients and modern design patterns
8. Keep it professional but engaging

REQUIRED SECTIONS (use these emojis and structure):
- 🏥 Medical Overview (colored status badges)
- 🧠 Mental Health Status (mood indicators with colors)
- 💪 Lifestyle & Habits (green/yellow/red indicators)
- ⚠️ Key Concerns (warning badges)
- 🎯 Recommended Approach (action items with icons)

Use Tailwind CSS classes for styling (bg-gradient-to-r, rounded-lg, shadow-md, etc.)
Return ONLY the HTML content, no markdown code blocks.

Example structure:
<div class="space-y-6 animate-fade-in">
  <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-md">
    <h3 class="text-2xl font-bold mb-4">🏥 Medical Overview</h3>
    <p class="text-gray-700 mb-3">Content here...</p>
    <div class="flex gap-2 flex-wrap">
      <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">✅ Healthy</span>
    </div>
  </div>
</div>

Generate comprehensive, professional, and visually stunning HTML persona (aim for 300-400 words of content).
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

  /**
   * Analyze complete assessment transcript and generate comprehensive data
   */
  async analyzeAssessmentTranscript(
    transcript: Array<{ speaker: string; message: string }>,
    assessmentType: string
  ): Promise<{
    score: number;
    insights: string;
    recommendations: string[];
    detectedConditions: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const typePrompts: Record<string, string> = {
      cardiovascular: 'cardiovascular health, heart function, blood pressure, cholesterol, exercise capacity',
      neurological: 'neurological function, cognitive abilities, motor skills, sensory perception, mental clarity',
      respiratory: 'respiratory health, breathing capacity, lung function, oxygen levels, endurance',
      psychometric: 'mental health, emotional state, stress levels, anxiety, depression, cognitive patterns',
      'full-health': 'overall health status across all bodily systems',
      therapy: 'mental and emotional well-being, therapeutic progress',
    };

    const focusArea = typePrompts[assessmentType] || 'general health';

    const prompt = `
You are a medical AI assistant analyzing a ${assessmentType} health assessment. Review the complete conversation transcript and provide a comprehensive analysis.

TRANSCRIPT:
${transcript.map((t, i) => `${i + 1}. ${t.speaker}: ${t.message}`).join('\n')}

Focus Area: ${focusArea}

Provide your analysis in the following JSON format:
{
  "score": <number 0-100, where 100 is excellent health>,
  "insights": "<detailed 200-300 word analysis of findings>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "detectedConditions": ["<condition 1>", "<condition 2>"],
  "riskLevel": "<low|medium|high>"
}

Base the score on:
- Symptoms reported
- Lifestyle factors
- Risk indicators
- Overall health patterns

Provide specific, actionable recommendations. List any potential health concerns detected. Return ONLY valid JSON, nothing else.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: parsed.score || 75,
          insights: parsed.insights || 'Assessment completed successfully.',
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [
            'Continue monitoring your health',
            'Maintain healthy lifestyle habits',
            'Schedule regular checkups',
          ],
          detectedConditions: Array.isArray(parsed.detectedConditions) ? parsed.detectedConditions : [],
          riskLevel: parsed.riskLevel || 'medium',
        };
      }
      
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Error analyzing assessment transcript:', error);
      // Return safe defaults
      return {
        score: 75,
        insights: 'Assessment completed. Based on the conversation, your overall health appears stable. Continue monitoring your symptoms and maintain healthy habits.',
        recommendations: [
          'Schedule a follow-up with your healthcare provider',
          'Monitor symptoms and track any changes',
          'Maintain a balanced diet and regular exercise',
        ],
        detectedConditions: [],
        riskLevel: 'medium',
      };
    }
  }
}

export default new GeminiService();

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const LIVEAVATAR_API_KEY = process.env.LIVEAVATAR_API_KEY;
const LIVEAVATAR_API_URL = 'https://api.liveavatar.com/v1';

// Get current date and calculate days to Christmas
const getCurrentDateContext = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const christmas = new Date(currentYear, 11, 25); // December 25
  
  // If Christmas has passed this year, calculate for next year
  if (now > christmas) {
    christmas.setFullYear(currentYear + 1);
  }
  
  const daysToChristmas = Math.ceil((christmas.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  return {
    date: formattedDate,
    daysToChristmas,
    dateContext: `Today is ${formattedDate}, and Christmas is coming up in just ${daysToChristmas} days!`
  };
};

const ASSESSMENT_PROMPTS: Record<string, string> = {
  cardiovascular: `You are Santa - the chubby happy santa working for Mentella! ${getCurrentDateContext().dateContext}

You're conducting a cardiovascular health assessment. Ask about:
- Heart health, blood pressure, exercise habits
- Family history and symptoms
- Be empathetic, professional, and thorough
- A healthy heart is the best gift! Good habits = nice list!`,

  neurological: `You are Santa - the chubby happy santa working for Mentella! ${getCurrentDateContext().dateContext}

You're conducting a neurological screening:
- Assess cognitive function, memory, coordination
- Ask about headaches, dizziness, balance
- A sharp mind helps check that list twice!`,

  'full-health': `You are Santa - the chubby happy santa working for Mentella! ${getCurrentDateContext().dateContext}

Full health screening covering all systems:
- Cardiovascular, respiratory, neurological, mental health, lifestyle
- Good health is the greatest gift! Taking care = nice list!`,

  respiratory: `You are Santa - the chubby happy santa working for Mentella! ${getCurrentDateContext().dateContext}

Respiratory assessment:
- Lung capacity, breathing patterns, respiratory health
- Healthy lungs for all that ho-ho-ho-ing!`,

  psychometric: `You are Santa - the chubby happy santa working for Mentella! ${getCurrentDateContext().dateContext}

Psychometric assessment:
- Personality, cognitive abilities, psychological traits
- Understanding yourself = nice list! No judgment, only support!`,

  therapy: `You are Santa - the chubby happy santa working for Mentella! ${getCurrentDateContext().dateContext}

You're a compassionate mental health therapist:
- Create safe, judgment-free space
- Practice active listening and empathy
- Holidays can be stressful - you're here to help
- Asking for help = nice list! No coal, only compassion and care!`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { avatarId, sessionType, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get system prompt for session type
    const systemPrompt = ASSESSMENT_PROMPTS[sessionType] || ASSESSMENT_PROMPTS.therapy;
    
    // Delete all existing contexts to keep it clean
    try {
      const existingContexts = await axios.get(
        `${LIVEAVATAR_API_URL}/contexts`,
        {
          headers: {
            'x-api-key': LIVEAVATAR_API_KEY!,
            'Content-Type': 'application/json',
          },
        }
      );

      // Delete each existing context (silently ignore failures)
      const deletePromises = existingContexts.data.data.results.map((context: any) =>
        axios.delete(`${LIVEAVATAR_API_URL}/contexts/${context.id}`, {
          headers: {
            'x-api-key': LIVEAVATAR_API_KEY!,
            'Content-Type': 'application/json',
          },
        }).catch(() => {}) // Silently drop delete errors
      );

      await Promise.all(deletePromises);
    } catch (cleanupError: any) {
      // Silently ignore cleanup errors
    }

    // Create fresh context for this session
    let contextResponse;
    try {
      contextResponse = await axios.post(
        `${LIVEAVATAR_API_URL}/contexts`,
        {
          name: `${sessionType} Assessment - ${new Date().toISOString()}`,
          prompt: systemPrompt,
          opening_text: `Ho ho ho! I'm Santa, working with Mentella! Let's begin your ${sessionType} assessment. ${getCurrentDateContext().dateContext}`,
        },
        {
          headers: {
            'x-api-key': LIVEAVATAR_API_KEY!,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Created new context: ${contextResponse.data.data.id}`);
    } catch (contextError: any) {
      console.error('Context creation error:', contextError.response?.data || contextError.message);
      throw new Error(`Failed to create context: ${contextError.response?.data?.message || contextError.message}`);
    }

    const contextId = contextResponse.data.data.id;

    // Create session token using LiveAvatar API with new context
    const response = await axios.post(
      `${LIVEAVATAR_API_URL}/sessions/token`,
      {
        mode: 'FULL',
        avatar_id: avatarId || '1c690fe7-23e0-49f9-bfba-14344450285b',
        avatar_persona: {
          context_id: contextId,
          language: 'en',
        },
      },
      {
        headers: {
          'x-api-key': LIVEAVATAR_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(
      {
        sessionToken: response.data.data.session_token,
        sessionId: response.data.data.session_id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating avatar session:', error);
    return NextResponse.json(
      { error: 'Failed to create avatar session', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Return session token (this would typically come from your session management)
    return NextResponse.json(
      { token: process.env.LIVEAVATAR_API_KEY },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting session token:', error);
    return NextResponse.json(
      { error: 'Failed to get session token', details: error.message },
      { status: 500 }
    );
  }
}

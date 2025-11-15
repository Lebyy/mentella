import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import dbConnect from '@/lib/mongodb';
import { AppConfig } from '@/models/AppConfig';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const apiKey = await getLiveAvatarApiKey();

    // Call LiveAvatar keep-alive endpoint
    const response = await axios.post(
      'https://api.liveavatar.com/v1/sessions/keep-alive',
      { session_id: sessionId },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Session kept alive',
        data: response.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error keeping session alive:', error.response?.data || error.message);
    
    // Don't fail hard - just log the error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to keep session alive',
        details: error.response?.data || error.message,
      },
      { status: 200 } // Return 200 so it doesn't break the flow
    );
  }
}

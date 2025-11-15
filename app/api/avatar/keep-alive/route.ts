import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const LIVEAVATAR_API_KEY = '6c6fed69-c25f-11f0-a99e-066a7fa2e369';

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

    // Call LiveAvatar keep-alive endpoint
    const response = await axios.post(
      'https://api.liveavatar.com/v1/sessions/keep-alive',
      { session_id: sessionId },
      {
        headers: {
          'x-api-key': LIVEAVATAR_API_KEY,
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

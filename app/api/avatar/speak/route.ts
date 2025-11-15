import { NextRequest, NextResponse } from 'next/server';
import liveAvatarService from '@/lib/services/liveAvatar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, text } = body;

    if (!sessionId || !text) {
      return NextResponse.json(
        { error: 'sessionId and text are required' },
        { status: 400 }
      );
    }

    await liveAvatarService.sendTextToSpeak(sessionId, text);

    return NextResponse.json(
      {
        message: 'Text sent to avatar successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending text to avatar:', error);
    return NextResponse.json(
      { error: 'Failed to send text to avatar', details: error.message },
      { status: 500 }
    );
  }
}

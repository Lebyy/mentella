import { NextRequest, NextResponse } from 'next/server';
import liveAvatarService from '@/lib/services/liveAvatar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { avatarId, voice, language } = body;

    const sessionData = await liveAvatarService.createStreamingSession({
      avatarId,
      voice,
      language,
    });

    return NextResponse.json(
      {
        message: 'Avatar session created successfully',
        sessionData,
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

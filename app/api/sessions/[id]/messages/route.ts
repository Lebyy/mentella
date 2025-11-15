import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TherapySession from '@/models/TherapySession';
import User from '@/models/User';
import geminiService from '@/lib/services/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { message, speaker } = body;
    const { id: sessionId } = await params;

    if (!message || !speaker) {
      return NextResponse.json(
        { error: 'message and speaker are required' },
        { status: 400 }
      );
    }

    // Get session
    const session = await TherapySession.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Add message to transcript (just store it, avatar handles responses)
    session.transcript.push({
      speaker,
      message,
      timestamp: new Date(),
    });

    await session.save();

    return NextResponse.json(
      {
        message: 'Message added successfully',
        transcript: session.transcript,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message', details: error.message },
      { status: 500 }
    );
  }
}

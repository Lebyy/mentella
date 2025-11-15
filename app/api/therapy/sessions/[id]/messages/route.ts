import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TherapySession from '@/models/TherapySession';
import User from '@/models/User';
import geminiService from '@/lib/services/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { message, speaker } = body;
    const sessionId = params.id;

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

    // Add user message to transcript
    session.transcript.push({
      speaker,
      message,
      timestamp: new Date(),
    });

    // If message is from user, generate AI response
    let aiResponse = null;
    if (speaker === 'user') {
      const user = await User.findById(session.userId);
      
      aiResponse = await geminiService.generateTherapyResponse(
        message,
        session.transcript.map((t: any) => ({ speaker: t.speaker, message: t.message })),
        user?.persona || undefined
      );

      // Add AI response to transcript
      session.transcript.push({
        speaker: 'avatar',
        message: aiResponse,
        timestamp: new Date(),
      });
    }

    await session.save();

    return NextResponse.json(
      {
        message: 'Message added successfully',
        aiResponse,
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

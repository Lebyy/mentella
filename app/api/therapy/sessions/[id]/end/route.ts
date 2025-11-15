import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TherapySession from '@/models/TherapySession';
import geminiService from '@/lib/services/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { mood } = body;
    const sessionId = params.id;

    // Get session
    const session = await TherapySession.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Calculate duration
    const duration = Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000);

    // Generate insights
    const insights = await geminiService.generateSessionInsights(
      session.transcript.map((t: any) => ({ speaker: t.speaker, message: t.message })),
      mood
    );

    // Update session
    session.endedAt = new Date();
    session.duration = duration;
    session.mood = mood;
    session.insights = insights;
    await session.save();

    return NextResponse.json(
      {
        message: 'Session ended successfully',
        session,
        insights,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Failed to end session', details: error.message },
      { status: 500 }
    );
  }
}

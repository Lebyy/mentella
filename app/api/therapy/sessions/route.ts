import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TherapySession from '@/models/TherapySession';
import User from '@/models/User';
import geminiService from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, sessionType } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create new therapy session
    const session = await TherapySession.create({
      userId,
      sessionType: sessionType || 'general',
      transcript: [],
    });

    // Increment user's session count
    await User.findByIdAndUpdate(userId, {
      $inc: { therapySessionsCount: 1 },
    });

    return NextResponse.json(
      {
        message: 'Therapy session started',
        session,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error starting therapy session:', error);
    return NextResponse.json(
      { error: 'Failed to start session', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const sessions = await TherapySession.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching therapy sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error.message },
      { status: 500 }
    );
  }
}

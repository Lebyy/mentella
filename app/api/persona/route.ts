import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Assessment from '@/models/Assessment';
import TherapySession from '@/models/TherapySession';
import geminiService from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get latest assessment
    const assessment = await Assessment.findOne({ userId }).sort({ createdAt: -1 });
    
    // Get recent therapy sessions
    const therapySessions = await TherapySession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Generate persona using Gemini AI
    const persona = await geminiService.generateUserPersona({
      userName: user.name,
      assessmentAnswers: assessment?.answers || [],
      therapySessions: therapySessions.map(s => ({
        transcript: s.transcript,
        mood: s.mood,
      })),
    });

    // Update user with persona
    await User.findByIdAndUpdate(userId, { persona });

    return NextResponse.json(
      {
        message: 'Persona generated successfully',
        persona,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error generating persona:', error);
    return NextResponse.json(
      { error: 'Failed to generate persona', details: error.message },
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        persona: user.persona || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona', details: error.message },
      { status: 500 }
    );
  }
}

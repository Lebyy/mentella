import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Assessment from '@/models/Assessment';
import User from '@/models/User';
import geminiService from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, answers } = body;

    // Validate required fields
    if (!userId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'userId and answers array are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate recommendations using Gemini AI
    const recommendations = await geminiService.generateAssessmentRecommendations(answers);

    // Create assessment
    const assessment = await Assessment.create({
      userId,
      answers,
      recommendations,
    });

    // Update user assessment status
    await User.findByIdAndUpdate(userId, {
      assessmentCompleted: true,
    });

    return NextResponse.json(
      {
        message: 'Assessment completed successfully',
        assessment,
        recommendations,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment', details: error.message },
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
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const assessments = await Assessment.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ assessments }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments', details: error.message },
      { status: 500 }
    );
  }
}

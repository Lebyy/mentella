import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TherapySession from '@/models/TherapySession';
import Assessment from '@/models/Assessment';
import User from '@/models/User';
import geminiService from '@/lib/services/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { mood } = body;
    const { id: sessionId } = await params;

    // Get session
    const session = await TherapySession.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Calculate duration
    const duration = Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000);

    // Generate comprehensive analysis using Gemini AI
    const analysis = await geminiService.analyzeAssessmentTranscript(
      session.transcript.map((t: any) => ({ speaker: t.speaker, message: t.message })),
      session.sessionType
    );

    // Update therapy session with basic insights
    session.endedAt = new Date();
    session.duration = duration;
    session.mood = mood;
    session.insights = analysis.insights;
    await session.save();

    // Create comprehensive Assessment record
    const assessment = await Assessment.create({
      userId: session.userId,
      type: session.sessionType,
      transcript: session.transcript,
      duration,
      score: analysis.score,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      startedAt: session.startedAt,
      completedAt: new Date(),
    });

    // Get user and all their assessments for persona generation
    const user = await User.findById(session.userId).populate('assessments');
    
    // Generate updated persona based on all assessment data
    const allAssessments = user?.assessments || [];
    const assessmentAnswers = allAssessments.map((a: any) => ({
      question: `${a.type} assessment`,
      answer: a.insights || '',
      category: a.type,
    }));

    const newPersona = await geminiService.generateUserPersona({
      userName: user?.name || 'User',
      assessmentAnswers,
      therapySessions: [{
        transcript: session.transcript,
        mood: mood,
      }],
    });

    // Save old persona to history if exists
    const updateData: any = {
      currentPersona: newPersona,
      $push: { assessments: assessment._id },
    };

    if (user?.currentPersona) {
      updateData.$push = {
        assessments: assessment._id,
        personaHistory: {
          persona: user.currentPersona,
          timestamp: new Date(),
        },
      };
    }

    // Update user with new persona and assessment
    await User.findByIdAndUpdate(session.userId, updateData);

    return NextResponse.json(
      {
        message: 'Session ended successfully',
        session,
        assessment: {
          id: assessment._id,
          score: analysis.score,
          insights: analysis.insights,
          recommendations: analysis.recommendations,
          detectedConditions: analysis.detectedConditions,
          riskLevel: analysis.riskLevel,
        },
        persona: {
          updated: true,
          persona: newPersona,
        },
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

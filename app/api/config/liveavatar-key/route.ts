import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AppConfig } from '@/models/AppConfig';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get('apiKey');

    await dbConnect();

    // If apiKey is provided, update it
    if (apiKey) {
      const config = await AppConfig.findOneAndUpdate(
        { key: 'LIVEAVATAR_API_KEY' },
        { 
          value: apiKey,
          description: 'LiveAvatar API key for session creation',
          updatedAt: new Date(),
        },
        { 
          upsert: true, 
          new: true 
        }
      );

      return NextResponse.json({
        message: 'LiveAvatar API key updated successfully',
        apiKey: config.value,
        updatedAt: config.updatedAt,
      });
    }

    // Otherwise, just fetch the current key
    const config = await AppConfig.findOne({ key: 'LIVEAVATAR_API_KEY' });

    if (!config) {
      return NextResponse.json(
        { error: 'API key not found in database', fallback: process.env.LIVEAVATAR_API_KEY || 'Not set' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      apiKey: config.value,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Error with LiveAvatar API key:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

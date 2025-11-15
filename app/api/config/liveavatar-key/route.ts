import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AppConfig } from '@/models/AppConfig';

// Secret token to protect this endpoint - you can change this to something more secure
const SECRET_TOKEN = process.env.CONFIG_UPDATE_SECRET || 'your-secret-token-here';

export async function POST(req: NextRequest) {
  try {
    // Verify secret token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update or create the LiveAvatar API key
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
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Error updating LiveAvatar API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify secret token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const config = await AppConfig.findOne({ key: 'LIVEAVATAR_API_KEY' });

    if (!config) {
      return NextResponse.json(
        { error: 'API key not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      apiKey: config.value,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching LiveAvatar API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

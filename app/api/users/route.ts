import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { clerkId, name, email, phone, dateOfBirth } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists by clerkId or email
    const existingUser = await User.findOne({ 
      $or: [
        { clerkId },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists', user: existingUser },
        { status: 200 }
      );
    }

    // Create new user
    const user = await User.create({
      clerkId,
      name,
      email: email.toLowerCase(),
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');
    const clerkId = searchParams.get('clerkId');

    if (clerkId) {
      const user = await User.findOne({ clerkId });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user }, { status: 200 });
    }

    if (email) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user }, { status: 200 });
    }

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Email, userId, or clerkId parameter required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error.message },
      { status: 500 }
    );
  }
}

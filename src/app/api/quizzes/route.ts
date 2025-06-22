import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/lib/models/Quiz';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await dbConnect();
    const quizzes = await Quiz.find({}).select('-questions.correctAnswerIndex');
    return NextResponse.json({ success: true, data: quizzes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Check authentication and get admin info
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin-session');
    
    if (!adminSession?.value) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const admin = await User.findById(adminSession.value);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Generate unique PIN
    let pin;
    let isUnique = false;
    while (!isUnique) {
      pin = Math.random().toString(36).substr(2, 6).toUpperCase();
      const existingQuiz = await Quiz.findOne({ pin });
      if (!existingQuiz) {
        isUnique = true;
      }
    }
    
    const quiz = await Quiz.create({
      ...body,
      pin,
      language: admin.language || 'en', // Save admin's language preference
      createdBy: admin._id,
    });
    
    return NextResponse.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    console.error('Quiz creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
} 
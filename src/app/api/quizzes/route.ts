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
  } catch {
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
    
    console.log('Admin creating quiz:', admin);
    console.log('Admin language:', admin.language);
    
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
    
    const quizData = {
      ...body,
      pin,
      language: admin.language || 'en', // Save admin's language preference
      createdBy: admin._id,
    };
    
    console.log('Creating quiz with data:', quizData);
    console.log('Quiz language being saved:', quizData.language);
    
    const quiz = await Quiz.create(quizData);
    
    return NextResponse.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    console.error('Quiz creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
} 
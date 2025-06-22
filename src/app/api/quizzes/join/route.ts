import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/lib/models/Quiz';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { pin, userName } = await request.json();
    
    if (!pin || !userName) {
      return NextResponse.json(
        { success: false, error: 'PIN and user name are required' },
        { status: 400 }
      );
    }
    
    const quiz = await Quiz.findOne({ pin: pin.toUpperCase() });
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN code' },
        { status: 404 }
      );
    }
    
    // Return quiz info without correct answers
    console.log('Quiz from DB:', quiz);
    console.log('Quiz language from DB:', quiz.language);
    
    const quizData = {
      _id: quiz._id,
      title: quiz.title,
      schoolName: quiz.schoolName,
      teacherName: quiz.teacherName,
      major: quiz.major,
      hasTimeLimit: quiz.hasTimeLimit,
      timeLimit: quiz.timeLimit,
      language: quiz.language || 'en', // Include the teacher's selected language
      questions: quiz.questions.map(q => ({
        _id: q._id,
        text: q.text,
        answers: q.answers,
        // Don't include correctAnswerIndex
      })),
    };
    
    console.log('Quiz data being returned:', quizData);
    console.log('Language being returned:', quizData.language);
    
    return NextResponse.json({ success: true, data: quizData });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to join quiz' },
      { status: 500 }
    );
  }
} 
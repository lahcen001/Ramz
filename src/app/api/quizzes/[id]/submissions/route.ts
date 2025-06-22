import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QuizSubmission from '@/lib/models/QuizSubmission';
import Quiz from '@/lib/models/Quiz';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // Check if quiz exists
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    // Get all submissions for this quiz
    const submissions = await QuizSubmission.find({ quizId: id })
      .sort({ submittedAt: -1 })
      .populate('quizId', 'title pin');
    
    return NextResponse.json({ 
      success: true, 
      data: {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          pin: quiz.pin,
          schoolName: quiz.schoolName,
          teacherName: quiz.teacherName,
          major: quiz.major,
        },
        submissions 
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
} 
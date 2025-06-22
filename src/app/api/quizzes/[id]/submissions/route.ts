import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/lib/models/Quiz';
import QuizSubmission from '@/lib/models/QuizSubmission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // Get the quiz
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    // Get all submissions for this quiz
    const submissions = await QuizSubmission.find({ quizId: id }).sort({ createdAt: -1 });
    
    // Format the data for the frontend
    const participantsData = {
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        pin: quiz.pin,
        schoolName: quiz.schoolName,
        teacherName: quiz.teacherName,
        major: quiz.major,
      },
      submissions: submissions.map(submission => ({
        _id: submission._id,
        userName: submission.userName,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage,
        results: submission.results,
        timeSpent: submission.timeSpent,
        submittedAt: submission.createdAt,
        wasAutoSubmitted: submission.wasAutoSubmitted,
      })),
    };
    
    return NextResponse.json({
      success: true,
      data: participantsData,
    });
  } catch (error) {
    console.error('Error fetching quiz submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
} 
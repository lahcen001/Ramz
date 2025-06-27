import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/lib/models/Quiz';
import QuizSubmission from '@/lib/models/QuizSubmission';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { answers, userName, timeSpent, wasAutoSubmitted } = await request.json();
    
    if (!answers || !userName) {
      return NextResponse.json(
        { success: false, error: 'Answers and user name are required' },
        { status: 400 }
      );
    }
    
    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    // Calculate score
    let score = 0;
    const results = quiz.questions.map((question: { text: string; answers: string[]; correctAnswerIndex: number }, index: number) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswerIndex;
      if (isCorrect) score++;
      
      return {
        questionIndex: index,
        questionText: question.text,
        userAnswerIndex: userAnswer,
        userAnswerText: question.answers[userAnswer] || 'No answer',
        correctAnswerIndex: question.correctAnswerIndex,
        correctAnswerText: question.answers[question.correctAnswerIndex],
        isCorrect,
      };
    });
    
    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    
    // Save submission to database
    const submission = await QuizSubmission.create({
      quizId: id,
      userName,
      answers,
      score,
      totalQuestions,
      percentage,
      results,
      timeSpent,
      wasAutoSubmitted,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        userName,
        score,
        totalQuestions,
        percentage,
        results,
        quizTitle: quiz.title,
        schoolName: quiz.schoolName,
        teacherName: quiz.teacherName,
        major: quiz.major,
        submissionId: submission._id,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
} 
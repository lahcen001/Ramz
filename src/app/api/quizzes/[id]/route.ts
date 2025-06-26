import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/lib/models/Quiz';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    // Ensure quiz has a language field (for backward compatibility)
    if (!quiz.language) {
      quiz.language = 'en';
    }
    
    console.log('Individual quiz data:', quiz);
    console.log('Individual quiz language:', quiz.language);
    
    return NextResponse.json({ success: true, data: quiz });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    const quiz = await Quiz.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: quiz });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const quiz = await Quiz.findByIdAndDelete(id);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
} 
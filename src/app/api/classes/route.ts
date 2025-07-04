import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/lib/models/Class';

// GET all classes
export async function GET() {
  try {
    await dbConnect();
    
    // For now, return empty array since we haven't implemented full class management
    return NextResponse.json({
      success: true,
      data: []
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST create new class
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, description, schoolName, teacherName, grade, subject, language } = body;
    
    if (!name || !schoolName || !teacherName) {
      return NextResponse.json(
        { success: false, error: 'Name, school name, and teacher name are required' },
        { status: 400 }
      );
    }
    
    const newClass = await Class.create({
      name,
      description,
      schoolName,
      teacherName,
      grade,
      subject,
      language: language || 'en',
      students: [],
      quizzes: [],
    });
    
    return NextResponse.json({
      success: true,
      data: newClass,
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create class' },
      { status: 500 }
    );
  }
} 
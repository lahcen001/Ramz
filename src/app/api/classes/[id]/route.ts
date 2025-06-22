import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/lib/models/Class';

// GET individual class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const classData = await Class.findById(id).populate('quizzes');
    
    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

// PUT update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedClass) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedClass,
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE class (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedClass) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete class' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Check if this is a login or registration
    if (body.action === 'register') {
      const { 
        email, 
        password, 
        name,
        language,
        schoolName,
        teacherName,
        major,
        hasTimeLimit,
        defaultTimeLimit
      } = body;
      
      if (!email || !password || !name) {
        return NextResponse.json(
          { success: false, error: 'Email, password, and name are required' },
          { status: 400 }
        );
      }
      
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email, role: 'admin' });
      if (existingAdmin) {
        return NextResponse.json(
          { success: false, error: 'Admin account already exists with this email' },
          { status: 400 }
        );
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create new admin
      const newAdmin = new User({
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        language: language || 'en',
        adminProfile: {
          schoolName,
          teacherName,
          major,
          hasDefaultTimeLimit: hasTimeLimit || false,
          defaultTimeLimit: hasTimeLimit ? defaultTimeLimit : undefined,
        },
      });
      
      await newAdmin.save();
      
      // Set admin cookie with user ID
      const cookieStore = await cookies();
      cookieStore.set('admin-session', newAdmin._id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Admin account created successfully',
        admin: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          language: newAdmin.language,
          adminProfile: newAdmin.adminProfile,
        }
      });
    } else {
      // Login
      const { email, password } = body;
      
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400 }
        );
      }
      
      // Find admin
      const admin = await User.findOne({ email, role: 'admin' });
      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      
      // Set admin cookie
      const cookieStore = await cookies();
      cookieStore.set('admin-session', admin._id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          language: admin.language,
          adminProfile: admin.adminProfile,
        }
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Logout - clear admin cookie
    const cookieStore = await cookies();
    cookieStore.delete('admin-session');
    
    return NextResponse.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    // Check if admin is authenticated
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin-session');
    
    if (!adminSession?.value) {
      return NextResponse.json({ 
        success: true, 
        authenticated: false 
      });
    }
    
    // Get admin info
    const admin = await User.findById(adminSession.value).select('-password');
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ 
        success: true, 
        authenticated: false 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      authenticated: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        language: admin.language,
        adminProfile: admin.adminProfile,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, authenticated: false });
  }
}

// Update admin profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
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
    
    const { 
      language,
      schoolName,
      teacherName,
      major,
      hasTimeLimit,
      defaultTimeLimit
    } = await request.json();
    
    // Update admin profile
    admin.language = language || admin.language;
    admin.adminProfile = {
      schoolName: schoolName || admin.adminProfile?.schoolName,
      teacherName: teacherName || admin.adminProfile?.teacherName,
      major: major || admin.adminProfile?.major,
      hasDefaultTimeLimit: hasTimeLimit !== undefined ? hasTimeLimit : admin.adminProfile?.hasDefaultTimeLimit,
      defaultTimeLimit: hasTimeLimit ? defaultTimeLimit : undefined,
    };
    
    await admin.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        language: admin.language,
        adminProfile: admin.adminProfile,
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 
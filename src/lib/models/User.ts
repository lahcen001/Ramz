import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  role: 'admin' | 'user';
  email?: string;
  password?: string;
  language?: 'en' | 'fr';
  adminProfile?: {
    schoolName?: string;
    teacherName?: string;
    major?: string;
    defaultTimeLimit?: number;
    hasDefaultTimeLimit?: boolean;
  };
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    required: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
  },
  language: {
    type: String,
    enum: ['en', 'fr'],
    default: 'en',
  },
  adminProfile: {
    schoolName: {
      type: String,
      trim: true,
    },
    teacherName: {
      type: String,
      trim: true,
    },
    major: {
      type: String,
      trim: true,
    },
    defaultTimeLimit: {
      type: Number,
      min: 1,
    },
    hasDefaultTimeLimit: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

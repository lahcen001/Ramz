import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  schoolName: {
    type: String,
    required: true,
    trim: true,
  },
  teacherName: {
    type: String,
    required: true,
    trim: true,
  },
  grade: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
  },
  students: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  quizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
  }],
  language: {
    type: String,
    enum: ['en', 'ar', 'fr'],
    default: 'en',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ClassSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Class || mongoose.model('Class', ClassSchema); 
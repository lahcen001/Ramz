import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  answers: string[];
  correctAnswerIndex: number;
}

export interface IQuiz extends Document {
  title: string;
  schoolName: string;
  teacherName: string;
  major: string;
  pin: string;
  questions: IQuestion[];
  createdBy?: mongoose.Types.ObjectId;
  timeLimit?: number; // Time limit in minutes (0 or null means no time limit)
  hasTimeLimit: boolean;
  language: string; // Language selected by the teacher (en, fr)
  classId?: mongoose.Types.ObjectId;
}

const QuestionSchema = new Schema<IQuestion>({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  answers: {
    type: [String],
    required: true,
    validate: {
      validator: function(answers: string[]) {
        return answers.length >= 2 && answers.length <= 6;
      },
      message: 'A question must have between 2 and 6 answers',
    },
  },
  correctAnswerIndex: {
    type: Number,
    required: true,
    min: 0,
  },
});

const QuizSchema = new Schema<IQuiz>({
  title: {
    type: String,
    required: true,
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
  major: {
    type: String,
    required: true,
    trim: true,
  },
  pin: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  questions: {
    type: [QuestionSchema],
    default: [],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  timeLimit: {
    type: Number,
    min: 1,
    max: 1440, // Max 24 hours
  },
  hasTimeLimit: {
    type: Boolean,
    default: false,
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'fr'],
    default: 'en',
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
  },
}, {
  timestamps: true,
});

// Generate unique PIN before saving
QuizSchema.pre('save', function(next) {
  if (!this.pin) {
    this.pin = Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  next();
});

export default mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);

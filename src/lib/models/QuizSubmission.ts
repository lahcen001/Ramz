import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizSubmission extends Document {
  quizId: mongoose.Types.ObjectId;
  userName: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  percentage: number;
  submittedAt: Date;
  timeSpent?: number; // Time spent in seconds
  wasAutoSubmitted?: boolean; // Whether quiz was auto-submitted due to timeout
  results: {
    questionIndex: number;
    questionText: string;
    userAnswerIndex: number;
    userAnswerText: string;
    correctAnswerIndex: number;
    correctAnswerText: string;
    isCorrect: boolean;
  }[];
}

const QuizSubmissionSchema = new Schema<IQuizSubmission>({
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  answers: {
    type: [Number],
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 0,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  timeSpent: {
    type: Number,
    min: 0,
  },
  wasAutoSubmitted: {
    type: Boolean,
    default: false,
  },
  results: [{
    questionIndex: Number,
    questionText: String,
    userAnswerIndex: Number,
    userAnswerText: String,
    correctAnswerIndex: Number,
    correctAnswerText: String,
    isCorrect: Boolean,
  }],
}, {
  timestamps: true,
});

export default mongoose.models.QuizSubmission || mongoose.model<IQuizSubmission>('QuizSubmission', QuizSubmissionSchema); 
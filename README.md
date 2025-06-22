# Ramz - Quiz Web Application

A modern quiz web application built with Next.js, MongoDB, and Chadcn UI components. Admins can create quizzes and users can join them using PIN codes.

## Features

### For Users:
- Join quizzes using PIN codes
- Take interactive quizzes with multiple choice questions
- View detailed results with scores and correct answers
- Beautiful, responsive UI with progress tracking

### For Admins:
- Create and manage quizzes
- Add multiple choice questions (2-6 answers per question)
- Automatically generated unique PIN codes
- Edit quiz details and view quiz statistics
- Admin dashboard to manage all quizzes

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI Components**: Chadcn UI (built on Tailwind CSS)
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS (via Chadcn UI components only)
- **Deployment**: Ready for Vercel deployment

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   The app uses the following MongoDB connection string (already configured):
   ```
   MONGODB_URI=mongodb+srv://lahcenelhanchir1:jMZY51Uq1BNjuJV6@cluster0.hvh1fnh.mongodb.net/ramz?retryWrites=true&w=majority
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

## Usage Guide

### For Users:
1. Go to the home page
2. Enter your name and a quiz PIN code
3. Take the quiz by selecting answers
4. View your results and detailed breakdown

### For Admins:
1. Click "Admin Panel" on the home page
2. Create new quizzes with title, school, teacher, and major
3. Add questions with multiple choice answers
4. Share the generated PIN code with students
5. Edit existing quizzes as needed

## Database Schema

### Quiz Model
- `title`: Quiz title
- `schoolName`: School name
- `teacherName`: Teacher name
- `major`: Subject/Major
- `pin`: Unique 6-character PIN code
- `questions`: Array of question objects

### Question Schema
- `text`: Question text
- `answers`: Array of answer choices (2-6 options)
- `correctAnswerIndex`: Index of the correct answer

## API Endpoints

- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create new quiz
- `GET /api/quizzes/[id]` - Get specific quiz
- `PUT /api/quizzes/[id]` - Update quiz
- `DELETE /api/quizzes/[id]` - Delete quiz
- `POST /api/quizzes/join` - Join quiz with PIN
- `POST /api/quizzes/[id]/submit` - Submit quiz answers

## Key Features

- **PIN-based Access**: Each quiz has a unique PIN for easy joining
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Validation**: Form validation with helpful error messages
- **Score Calculation**: Automatic scoring with percentage calculation
- **Detailed Results**: Shows correct/incorrect answers with explanations
- **Admin Dashboard**: Easy quiz management interface

## Deployment

The app is ready for deployment on platforms like Vercel, Netlify, or any Node.js hosting service. Make sure to set the `MONGODB_URI` environment variable in your deployment environment.

## Security Notes

- No authentication system implemented (as per MVP requirements)
- Admin panel is accessible to anyone (suitable for simple use cases)
- Consider adding authentication for production use

## Contributing

This is a simple MVP. For production use, consider adding:
- User authentication
- Real-time quiz features
- File upload for bulk question import
- Advanced analytics and reporting
- Role-based access control

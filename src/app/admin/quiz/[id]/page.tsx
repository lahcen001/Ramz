'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Quiz {
  _id: string;
  title: string;
  schoolName: string;
  teacherName: string;
  major: string;
  pin: string;
  questions: Array<{
    text: string;
    answers: string[];
    correctAnswerIndex: number;
  }>;
  hasTimeLimit: boolean;
  timeLimit?: number;
}

export default function EditQuizPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const fetchQuiz = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/quizzes/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setQuiz(data.data);
      } else {
        setError('Failed to fetch quiz');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizChange = (field: keyof Omit<Quiz, '_id' | 'questions' | 'pin'>, value: string | boolean | number) => {
    if (quiz) {
      setQuiz(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleSave = async () => {
    if (!quiz) return;

    if (!quiz.title.trim() || !quiz.schoolName.trim() || 
        !quiz.teacherName.trim() || !quiz.major.trim()) {
      setError('All quiz details are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/quizzes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: quiz.title,
          schoolName: quiz.schoolName,
          teacherName: quiz.teacherName,
          major: quiz.major,
          questions: quiz.questions,
          hasTimeLimit: quiz.hasTimeLimit,
          timeLimit: quiz.timeLimit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Quiz updated successfully!');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        setError(data.error || 'Failed to update quiz');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6">
            <p>Loading quiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">Quiz not found</p>
            <Button onClick={() => router.push('/admin')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Quiz</h1>
            <p className="text-gray-600 mt-2">
              PIN: <code className="bg-gray-100 px-2 py-1 rounded font-mono text-lg">{quiz.pin}</code>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>Edit the basic information for your quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={quiz.title}
                  onChange={(e) => handleQuizChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={quiz.schoolName}
                  onChange={(e) => handleQuizChange('schoolName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherName">Teacher Name</Label>
                <Input
                  id="teacherName"
                  value={quiz.teacherName}
                  onChange={(e) => handleQuizChange('teacherName', e.target.value)}
                />
              </div>
                              <div className="space-y-2">
                  <Label htmlFor="major">Major/Subject</Label>
                  <Input
                    id="major"
                    value={quiz.major}
                    onChange={(e) => handleQuizChange('major', e.target.value)}
                  />
                </div>
              </div>

              {/* Timer Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasTimeLimit"
                    checked={quiz.hasTimeLimit || false}
                    onChange={(e) => handleQuizChange('hasTimeLimit', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="hasTimeLimit" className="font-medium">
                    Set time limit for this quiz
                  </Label>
                </div>
                
                {quiz.hasTimeLimit && (
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="1"
                      max="1440"
                      placeholder="Enter time limit in minutes"
                      value={quiz.timeLimit || 30}
                      onChange={(e) => handleQuizChange('timeLimit', parseInt(e.target.value) || 30)}
                    />
                    <p className="text-sm text-gray-600">
                      Students will have {quiz.timeLimit || 30} minutes to complete the quiz
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        {quiz.questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Questions ({quiz.questions.length})</CardTitle>
              <CardDescription>Quiz questions overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quiz.questions.map((question: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                    </div>
                    <p className="mb-2">{question.text}</p>
                    <div className="space-y-1 text-sm">
                      {question.answers.map((answer: string, answerIndex: number) => (
                        <div
                          key={answerIndex}
                          className={`${
                            answerIndex === question.correctAnswerIndex
                              ? 'font-medium text-green-700'
                              : 'text-gray-600'
                          }`}
                        >
                          {String.fromCharCode(65 + answerIndex)}. {answer}
                          {answerIndex === question.correctAnswerIndex && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
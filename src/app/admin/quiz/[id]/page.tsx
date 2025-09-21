'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, ArrowLeft, Target, Settings, FileText, Save, Sparkles, Clock } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
  const { t, i18n } = useTranslation();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const params = useParams();

  const checkAuthentication = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/admin');
      const data = await response.json();
      
      if (data.authenticated && data.admin) {
        setIsAuthenticated(true);
        
        if (data.admin.language && data.admin.language !== i18n.language) {
          await i18n.changeLanguage(data.admin.language);
        }
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setCheckingAuth(false);
    }
  }, [i18n, router]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const fetchQuiz = useCallback(async () => {
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
  }, [params.id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleQuizChange = (field: keyof Omit<Quiz, '_id' | 'questions' | 'pin'>, value: string | boolean | number) => {
    if (quiz) {
      setQuiz(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleQuestionChange = (index: number, field: 'text' | 'answers' | 'correctAnswerIndex', value: string | string[] | number) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value
      };
      setQuiz({ ...quiz, questions: updatedQuestions });
    }
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number, value: string) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions];
      const updatedAnswers = [...updatedQuestions[questionIndex].answers];
      updatedAnswers[answerIndex] = value;
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        answers: updatedAnswers
      };
      setQuiz({ ...quiz, questions: updatedQuestions });
    }
  };

  const addNewQuestion = () => {
    if (quiz) {
      const newQuestion = {
        text: '',
        answers: ['', '', '', ''],
        correctAnswerIndex: 0
      };
      setQuiz({
        ...quiz,
        questions: [...quiz.questions, newQuestion]
      });
    }
  };

  const deleteQuestion = (index: number) => {
    if (quiz && confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = [...quiz.questions];
      updatedQuestions.splice(index, 1);
      setQuiz({ ...quiz, questions: updatedQuestions });
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

  if (checkingAuth) {
    return <PageLoader text={t('admin.dashboard.checkingAuth')} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <PageLoader text="Loading quiz..." />;
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
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="h-full flex flex-col sm:max-w-6xl sm:mx-auto relative">
        {/* Header - Fixed for mobile */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Edit Quiz
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">PIN: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{quiz.pin}</code></p>
              </div>
            </div>
            <div className="flex gap-2">
              <LanguageSwitcher />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => router.push('/admin')}
                className="h-8 sm:h-10 px-3 sm:px-4"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 sm:space-y-6">
            {/* Animated Sparkles - Hidden on mobile */}
            <div className="hidden sm:flex justify-center space-x-4 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" style={{ animationDelay: '0s' }} />
              <Sparkles className="h-8 w-8 text-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <Sparkles className="h-6 w-6 text-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {/* Quiz Details Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Quiz Details
                </CardTitle>
                <CardDescription className="text-sm">Edit the basic information for your quiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Quiz Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter quiz title"
                      value={quiz.title}
                      onChange={(e) => handleQuizChange('title', e.target.value)}
                      className="h-11 sm:h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major" className="text-sm font-medium">Major/Subject *</Label>
                    <Input
                      id="major"
                      placeholder="Enter major or subject"
                      value={quiz.major}
                      onChange={(e) => handleQuizChange('major', e.target.value)}
                      className="h-11 sm:h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="text-sm font-medium">School Name</Label>
                    <Input
                      id="schoolName"
                      placeholder="Enter school name"
                      value={quiz.schoolName}
                      onChange={(e) => handleQuizChange('schoolName', e.target.value)}
                      className="h-11 sm:h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherName" className="text-sm font-medium">Teacher Name</Label>
                    <Input
                      id="teacherName"
                      placeholder="Enter teacher name"
                      value={quiz.teacherName}
                      onChange={(e) => handleQuizChange('teacherName', e.target.value)}
                      className="h-11 sm:h-12"
                    />
                  </div>
                </div>

                {/* Timer Settings */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Set time limit for this quiz
                    </Label>
                    <input
                      type="checkbox"
                      checked={quiz.hasTimeLimit || false}
                      onChange={(e) => handleQuizChange('hasTimeLimit', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {quiz.hasTimeLimit && (
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit" className="text-sm">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min="1"
                        max="180"
                        value={quiz.timeLimit || 30}
                        onChange={(e) => handleQuizChange('timeLimit', parseInt(e.target.value) || 30)}
                        className="h-11 sm:h-12 max-w-32"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Questions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Questions ({quiz.questions.length})
                  </span>
                  <Button onClick={addNewQuestion} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Question
                  </Button>
                </CardTitle>
                <CardDescription className="text-sm">Edit quiz questions and answers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {quiz.questions.map((question, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-lg">Question {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestion(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`question-${index}`} className="text-sm font-medium">Question Text</Label>
                          <Input
                            id={`question-${index}`}
                            value={question.text}
                            onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                            placeholder="Enter the question text"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Answers</Label>
                          {question.answers.map((answer, answerIndex: number) => (
                            <div key={answerIndex} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`correct-answer-${index}`}
                                checked={answerIndex === question.correctAnswerIndex}
                                onChange={() => handleQuestionChange(index, 'correctAnswerIndex', answerIndex)}
                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                              />
                              <Input
                                value={answer}
                                onChange={(e) => handleAnswerChange(index, answerIndex, e.target.value)}
                                placeholder={`Answer ${String.fromCharCode(65 + answerIndex)}`}
                                className={`flex-1 h-11 ${answerIndex === question.correctAnswerIndex ? 'border-green-500 bg-green-50' : ''}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {quiz.questions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No questions yet. Click the Add Question button to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center pb-4">
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5 sm:h-6 sm:w-6" />
                    Save Changes
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

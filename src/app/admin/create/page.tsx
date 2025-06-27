'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Minus, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Sparkles, 
  Target,
  FileText,
  Settings,
  Save,
  Trash2
} from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { Loader2 } from 'lucide-react';

interface Question {
  text: string;
  answers: string[];
  correctAnswerIndex: number;
}

interface CSVQuestion {
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  correctAnswer: number;
}

interface QuizForm {
  title: string;
  schoolName: string;
  teacherName: string;
  major: string;
  hasTimeLimit: boolean;
  timeLimit: number;
}

export default function CreateQuizPage() {
  const { i18n } = useTranslation();
  const [quizForm, setQuizForm] = useState<QuizForm>({
    title: '',
    schoolName: '',
    teacherName: '',
    major: '',
    hasTimeLimit: false,
    timeLimit: 30,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    answers: ['', ''],
    correctAnswerIndex: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  const checkAuthentication = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/admin');
      const data = await response.json();
      
      if (data.authenticated && data.admin) {
        setIsAuthenticated(true);
        
        // Set language from admin profile
        if (data.admin.language && data.admin.language !== i18n.language) {
          await i18n.changeLanguage(data.admin.language);
        }
        
        // Pre-fill form with admin profile data
        if (data.admin.adminProfile) {
          setQuizForm(prev => ({
            ...prev,
            schoolName: data.admin.adminProfile?.schoolName || '',
            teacherName: data.admin.adminProfile?.teacherName || '',
            major: data.admin.adminProfile?.major || '',
            hasTimeLimit: data.admin.adminProfile?.hasDefaultTimeLimit || false,
            timeLimit: data.admin.adminProfile?.defaultTimeLimit || 30,
          }));
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

  useEffect(() => {
    // Check for imported questions from CSV
    const urlParams = new URLSearchParams(window.location.search);
    const imported = urlParams.get('imported');
    
    if (imported === 'true') {
      const importedQuestions = localStorage.getItem('importedQuestions');
      if (importedQuestions) {
        try {
          const csvQuestions = JSON.parse(importedQuestions);
          const formattedQuestions: Question[] = csvQuestions.map((q: CSVQuestion) => ({
            text: q.question,
            answers: [q.answer1, q.answer2, q.answer3, q.answer4],
            correctAnswerIndex: q.correctAnswer
          }));
          
          setQuestions(formattedQuestions);
          localStorage.removeItem('importedQuestions'); // Clean up
          
          // Show success message
          setSuccess(`Successfully imported ${formattedQuestions.length} questions from CSV!`);
          setTimeout(() => setSuccess(''), 5000);
        } catch {
          setError('Error loading imported questions');
        }
      }
    }
  }, []);

  const handleQuizFormChange = (field: keyof QuizForm, value: string | boolean | number) => {
    setQuizForm(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionTextChange = (text: string) => {
    setCurrentQuestion(prev => ({ ...prev, text }));
  };

  const handleAnswerChange = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      answers: prev.answers.map((answer, i) => i === index ? value : answer)
    }));
  };

  const addAnswer = () => {
    if (currentQuestion.answers.length < 6) {
      setCurrentQuestion(prev => ({
        ...prev,
        answers: [...prev.answers, '']
      }));
    }
  };

  const removeAnswer = (index: number) => {
    if (currentQuestion.answers.length > 2) {
      setCurrentQuestion(prev => ({
        ...prev,
        answers: prev.answers.filter((_, i) => i !== index),
        correctAnswerIndex: prev.correctAnswerIndex >= index && prev.correctAnswerIndex > 0 
          ? prev.correctAnswerIndex - 1 
          : prev.correctAnswerIndex
      }));
    }
  };

  const handleCorrectAnswerChange = (index: number) => {
    setCurrentQuestion(prev => ({ ...prev, correctAnswerIndex: index }));
  };

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.answers.some(answer => !answer.trim())) {
      setError('All answer options must be filled');
      return;
    }

    setQuestions(prev => [...prev, currentQuestion]);
    setCurrentQuestion({
      text: '',
      answers: ['', ''],
      correctAnswerIndex: 0,
    });
    setError('');
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!quizForm.title.trim() || !quizForm.schoolName.trim() || 
        !quizForm.teacherName.trim() || !quizForm.major.trim()) {
      setError('All quiz details are required');
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...quizForm,
          questions,
          language: i18n.language, // Include the current language
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Quiz created successfully! PIN: ${data.data.pin}`);
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create quiz');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
    return <PageLoader text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return null;
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
                  Create Quiz
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Build engaging quizzes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => router.push('/admin')}
                className="h-8 sm:h-10 px-3 sm:px-4"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
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
                <CardDescription className="text-sm">Set up your quiz information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Quiz Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter quiz title"
                      value={quizForm.title}
                      onChange={(e) => handleQuizFormChange('title', e.target.value)}
                      className="h-11 sm:h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major" className="text-sm font-medium">Subject/Major *</Label>
                    <Input
                      id="major"
                      placeholder="e.g., Mathematics, Physics"
                      value={quizForm.major}
                      onChange={(e) => handleQuizFormChange('major', e.target.value)}
                      className="h-11 sm:h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="text-sm font-medium">School Name</Label>
                    <Input
                      id="schoolName"
                      placeholder="School or institution name"
                      value={quizForm.schoolName}
                      onChange={(e) => handleQuizFormChange('schoolName', e.target.value)}
                      className="h-11 sm:h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherName" className="text-sm font-medium">Teacher Name</Label>
                    <Input
                      id="teacherName"
                      placeholder="Your name"
                      value={quizForm.teacherName}
                      onChange={(e) => handleQuizFormChange('teacherName', e.target.value)}
                      className="h-11 sm:h-12"
                    />
                  </div>
                </div>

                {/* Time Limit Settings */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Enable Time Limit
                    </Label>
                    <input
                      type="checkbox"
                      checked={quizForm.hasTimeLimit}
                      onChange={(e) => handleQuizFormChange('hasTimeLimit', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {quizForm.hasTimeLimit && (
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit" className="text-sm">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min="1"
                        max="180"
                        value={quizForm.timeLimit}
                        onChange={(e) => handleQuizFormChange('timeLimit', parseInt(e.target.value) || 30)}
                        className="h-11 sm:h-12 max-w-32"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Question Builder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FileText className="h-5 w-5 text-green-600" />
                  Add Question
                </CardTitle>
                <CardDescription className="text-sm">Create questions for your quiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="questionText" className="text-sm font-medium">Question Text *</Label>
                  <Textarea
                    id="questionText"
                    placeholder="Enter your question here..."
                    value={currentQuestion.text}
                    onChange={(e) => handleQuestionTextChange(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Answer Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAnswer}
                      disabled={currentQuestion.answers.length >= 6}
                      className="h-8 px-3"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswerIndex === index}
                          onChange={() => handleCorrectAnswerChange(index)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={answer}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          className="flex-1 h-11"
                        />
                        {currentQuestion.answers.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAnswer(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={addQuestion}
                    className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            {questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    Questions ({questions.length})
                  </CardTitle>
                  <CardDescription className="text-sm">Review and manage your quiz questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                              {index + 1}. {question.text}
                            </h4>
                            <div className="space-y-1">
                              {question.answers.map((answer, answerIndex) => (
                                <div key={answerIndex} className="flex items-center gap-2 text-xs sm:text-sm">
                                  {answerIndex === question.correctAnswerIndex ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  )}
                                  <span className={answerIndex === question.correctAnswerIndex ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                    {answer}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pb-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || questions.length === 0}
                className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Quiz...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5 sm:h-6 sm:w-6" />
                    Create Quiz ({questions.length} question{questions.length !== 1 ? 's' : ''})
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
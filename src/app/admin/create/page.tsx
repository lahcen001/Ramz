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
  School, 
  User, 
  GraduationCap, 
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
    return null; // Will redirect to login
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 animate-pulse"></div>
              <div className="relative bg-white rounded-lg p-4 shadow-lg">
                <Target className="h-12 w-12 text-blue-600 mx-auto" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Create New Quiz
          </h1>
          <p className="text-xl text-gray-600 mb-8">Build engaging quizzes with beautiful interface</p>
          
          {/* Animated Sparkles */}
          <div className="flex justify-center space-x-4 mb-8">
            <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" style={{ animationDelay: '0s' }} />
            <Sparkles className="h-8 w-8 text-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <Sparkles className="h-6 w-6 text-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="px-6 py-3 text-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Alerts */}
        <div className="space-y-4 mb-8">
          {error && (
            <Alert className="border-red-200 bg-red-50 animate-in slide-in-from-top duration-300">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 animate-in slide-in-from-top duration-300">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quiz Details Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-8 animate-in fade-in-50 duration-500">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">Quiz Configuration</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Set up the basic information for your quiz
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="title" className="font-medium text-gray-700">Quiz Title</Label>
                </div>
                <Input
                  id="title"
                  placeholder="Enter quiz title"
                  value={quizForm.title}
                  onChange={(e) => handleQuizFormChange('title', e.target.value)}
                  className="h-12 text-lg border-2 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-green-600" />
                  <Label htmlFor="schoolName" className="font-medium text-gray-700">School Name</Label>
                </div>
                <Input
                  id="schoolName"
                  placeholder="Enter school name"
                  value={quizForm.schoolName}
                  onChange={(e) => handleQuizFormChange('schoolName', e.target.value)}
                  className="h-12 text-lg border-2 focus:border-green-500 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <Label htmlFor="teacherName" className="font-medium text-gray-700">Teacher Name</Label>
                </div>
                <Input
                  id="teacherName"
                  placeholder="Enter teacher name"
                  value={quizForm.teacherName}
                  onChange={(e) => handleQuizFormChange('teacherName', e.target.value)}
                  className="h-12 text-lg border-2 focus:border-purple-500 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="major" className="font-medium text-gray-700">Major/Subject</Label>
                </div>
                <Input
                  id="major"
                  placeholder="Enter major or subject"
                  value={quizForm.major}
                  onChange={(e) => handleQuizFormChange('major', e.target.value)}
                  className="h-12 text-lg border-2 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Timer Settings */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasTimeLimit"
                  checked={quizForm.hasTimeLimit}
                  onChange={(e) => handleQuizFormChange('hasTimeLimit', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <Label htmlFor="hasTimeLimit" className="text-lg font-medium text-gray-700">
                    Set time limit for this quiz
                  </Label>
                </div>
              </div>
              
              {quizForm.hasTimeLimit && (
                <div className="space-y-3 ml-8 animate-in slide-in-from-left duration-300">
                  <Label htmlFor="timeLimit" className="font-medium text-gray-700">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="Enter time limit in minutes"
                    value={quizForm.timeLimit}
                    onChange={(e) => handleQuizFormChange('timeLimit', parseInt(e.target.value) || 30)}
                    className="h-12 text-lg border-2 focus:border-blue-500 transition-colors max-w-xs"
                  />
                  <p className="text-base text-blue-600 font-medium">
                    ⏱️ Students will have {quizForm.timeLimit} minutes to complete the quiz
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Question Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-8 animate-in fade-in-50 duration-700">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="h-6 w-6 text-green-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">Add Question</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Create engaging questions for your quiz
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="questionText" className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Question Text
              </Label>
              <Textarea
                id="questionText"
                placeholder="Enter your question here..."
                value={currentQuestion.text}
                onChange={(e) => handleQuestionTextChange(e.target.value)}
                className="min-h-[100px] text-lg border-2 focus:border-green-500 transition-colors resize-none"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Answer Options
              </Label>
              
              <div className="space-y-3">
                {currentQuestion.answers.map((answer, index) => (
                  <div key={index} className="flex gap-3 items-center p-4 rounded-lg border-2 border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={currentQuestion.correctAnswerIndex === index}
                        onChange={() => handleCorrectAnswerChange(index)}
                        className="w-5 h-5 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        {currentQuestion.correctAnswerIndex === index ? 'Correct' : 'Option'}
                      </span>
                    </div>
                    
                    <Input
                      placeholder={`Answer ${String.fromCharCode(65 + index)}`}
                      value={answer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="flex-1 h-12 text-lg border-2 focus:border-blue-500 transition-colors"
                    />
                    
                    {currentQuestion.answers.length > 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAnswer(index)}
                        className="px-3 py-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {currentQuestion.answers.length < 6 && (
                <Button 
                  variant="outline" 
                  onClick={addAnswer}
                  className="w-full h-12 text-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Answer Option
                </Button>
              )}
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                onClick={addQuestion}
                className="px-8 py-3 text-lg font-medium bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Question to Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions Review */}
        {questions.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-8 animate-in fade-in-50 duration-900">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Questions Added ({questions.length})
                </CardTitle>
              </div>
              <CardDescription className="text-lg">
                Review your questions before creating the quiz
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div 
                    key={index} 
                    className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-lg transition-all duration-200 animate-in slide-in-from-bottom"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Question {index + 1}</h4>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    
                    <p className="text-lg text-gray-800 mb-4 font-medium">{question.text}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.answers.map((answer, answerIndex) => (
                        <div
                          key={answerIndex}
                          className={`p-3 rounded-lg border-2 flex items-center gap-2 ${
                            answerIndex === question.correctAnswerIndex
                              ? 'bg-green-100 border-green-300 text-green-800 font-bold'
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          <span className="font-bold text-sm">
                            {String.fromCharCode(65 + answerIndex)}.
                          </span>
                          <span className="flex-1">{answer}</span>
                          {answerIndex === question.correctAnswerIndex && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Quiz Button */}
        <div className="flex justify-center pb-8">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || questions.length === 0}
            className="px-12 py-4 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-3">Creating Quiz...</span>
              </>
            ) : (
              <>
                <Save className="h-6 w-6 mr-3" />
                Create Quiz ({questions.length} question{questions.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 
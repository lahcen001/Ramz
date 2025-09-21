'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, ChevronLeft, AlertTriangle, Target } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { Loader2 } from 'lucide-react';

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
  language?: string;
}

export default function QuizPage() {
  const { t, i18n } = useTranslation();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Get user name from URL params or session storage
  useEffect(() => {
    const nameFromUrl = searchParams.get('name');
    if (nameFromUrl) {
      setUserName(nameFromUrl);
    } else {
      const storedName = sessionStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      } else {
        router.push('/');
      }
    }
  }, [searchParams, router]);

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await fetch(`/api/quizzes/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setQuiz(data.data);
        
        // Set language from quiz (teacher's selection)
        if (data.data.language && data.data.language !== i18n.language) {
          await i18n.changeLanguage(data.data.language);
        }
        
        // Set timer if quiz has time limit
        if (data.data.hasTimeLimit && data.data.timeLimit) {
          setTimeLeft(data.data.timeLimit * 60); // Convert minutes to seconds
        }
      } else {
        setError('Quiz not found');
      }
    } catch {
      setError('Failed to load quiz');
    }
  }, [params.id, i18n]);

  useEffect(() => {
    if (params.id) {
      fetchQuiz();
    }
  }, [params.id, fetchQuiz]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz || !userName || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Convert selectedAnswers to simple array format expected by backend
      // Fill with -1 for unanswered questions
      const answers = Array(quiz.questions.length).fill(-1);
      Object.entries(selectedAnswers).forEach(([questionIndex, answerIndex]) => {
        const index = parseInt(questionIndex);
        if (index >= 0 && index < quiz.questions.length) {
          answers[index] = answerIndex;
        }
      });

      console.log('Submitting quiz with data:', { userName, answers, selectedAnswers });
      
      const response = await fetch(`/api/quizzes/${quiz._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName,
          answers,
          timeSpent: quiz.hasTimeLimit && quiz.timeLimit ? (quiz.timeLimit * 60) - (timeLeft || 0) : undefined,
          wasAutoSubmitted: timeLeft === 0,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        router.push(`/quiz/${quiz._id}/results?name=${encodeURIComponent(userName)}`);
      } else {
        setError(data.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, userName, isSubmitting, selectedAnswers, timeLeft, router]);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmitQuiz]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number, totalSeconds: number) => {
    const percentage = (seconds / totalSeconds) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!quiz) {
    return <PageLoader text={t('quiz.loadingQuiz')} />;
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Responsive Quiz Layout */}
      <div className="min-h-screen flex flex-col lg:max-w-6xl lg:mx-auto">
        {/* Header - Compact for mobile */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Quiz Info */}
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                  {quiz.title}
                </h1>
                <p className="text-xs text-gray-600">
                  {t('quiz.welcome')}, {userName}
                </p>
              </div>
            </div>

            {/* Timer - Mobile optimized */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white shadow-sm ${getTimeColor(timeLeft, quiz.timeLimit! * 60)}`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono font-semibold">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{t('quiz.question')} {currentQuestion + 1} {t('quiz.of')} {quiz.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

                  {/* Question Content - Flexible height */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <Card className="flex-1 flex flex-col shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            {/* Question Header */}
            <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  🔀 {t('quiz.shuffled')}
                </span>
                <span className="text-xs text-gray-500">
                  ID: {quiz._id.slice(-6)}
                </span>
              </div>
              <CardTitle className="text-base sm:text-lg text-gray-900 leading-relaxed">
                {question.text}
              </CardTitle>
            </CardHeader>

            {/* Answers - Scrollable if needed */}
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 space-y-3 overflow-y-auto">
                {question.answers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswers({ [currentQuestion]: index })}
                    className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswers[currentQuestion] === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswers[currentQuestion] === index && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-sm sm:text-base">{answer}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="mt-3 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Navigation Buttons */}
              <div className="flex-shrink-0 flex gap-3 mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(currentQuestion - 1, 0))}
                  disabled={currentQuestion === 0 || isSubmitting}
                  className="flex-1 h-11 sm:h-12"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t('quiz.previous')}
                </Button>

                {currentQuestion < quiz.questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    disabled={isSubmitting || selectedAnswers[currentQuestion] === undefined}
                    className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {t('quiz.next')}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting || selectedAnswers[currentQuestion] === undefined}
                    className="flex-1 h-11 sm-h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('quiz.submitting')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {t('quiz.submit')}
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Warning - Mobile optimized */}
        {timeLeft !== null && timeLeft <= 60 && timeLeft > 0 && (
          <div className="flex-shrink-0 bg-red-50 border-t border-red-200 px-4 py-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t('quiz.warnings.timeWarning')} {Math.ceil(timeLeft / 60)} {t('quiz.warnings.minute')} {t('quiz.warnings.remaining')}
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              {t('quiz.warnings.autoSubmit')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

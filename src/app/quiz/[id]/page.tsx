'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Target } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { Loader2 } from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  answers: string[];
}

interface QuizData {
  _id: string;
  title: string;
  schoolName: string;
  teacherName: string;
  major: string;
  questions: Question[];
  hasTimeLimit: boolean;
  timeLimit?: number;
  language?: string;
}

export default function QuizPage() {
  const { t, i18n } = useTranslation();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userName, setUserName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [questionMapping, setQuestionMapping] = useState<number[]>([]); // Maps shuffled index to original index
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const storedQuizData = sessionStorage.getItem('quizData');
    const storedUserName = sessionStorage.getItem('userName');
    
    if (!storedQuizData || !storedUserName) {
      router.push('/');
      return;
    }

    try {
      const parsedQuizData = JSON.parse(storedQuizData);
      console.log('Quiz data from session:', parsedQuizData);
      console.log('Quiz language:', parsedQuizData.language);
      console.log('Current i18n language:', i18n.language);
      
      // Shuffle questions for anti-cheating (each user gets different order)
      const shuffleArray = (array: any[]) => {
        const indexed = array.map((item, index) => ({ item, originalIndex: index }));
        for (let i = indexed.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
        }
        return indexed;
      };
      
      const shuffledIndexedQuestions = shuffleArray(parsedQuizData.questions);
      const shuffled = shuffledIndexedQuestions.map(item => item.item);
      const mapping = shuffledIndexedQuestions.map(item => item.originalIndex);
      
      console.log('Original question order:', parsedQuizData.questions.map((q: any) => q.text.substring(0, 30) + '...'));
      console.log('Shuffled question order:', shuffled.map((q: any) => q.text.substring(0, 30) + '...'));
      console.log('Question mapping (shuffled index -> original index):', mapping);
      
      setQuizData(parsedQuizData);
      setShuffledQuestions(shuffled);
      setQuestionMapping(mapping);
      setUserName(storedUserName);
      setAnswers(new Array(parsedQuizData.questions.length).fill(-1));
      
      // Force set the teacher's language and update document direction
      if (parsedQuizData.language) {
        console.log('Setting language to:', parsedQuizData.language);
        i18n.changeLanguage(parsedQuizData.language);
        const isRTL = parsedQuizData.language === 'ar';
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = parsedQuizData.language;
      } else {
        console.log('No language found in quiz data, defaulting to English');
        i18n.changeLanguage('en');
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
      }
      
      if (parsedQuizData.hasTimeLimit && parsedQuizData.timeLimit) {
        const startTime = Date.now();
        setQuizStartTime(startTime);
        setTimeRemaining(parsedQuizData.timeLimit * 60);
      }
    } catch (err) {
      setError('Failed to load quiz data');
      router.push('/');
    }
  }, [router, i18n]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmitQuiz(answers, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, answers]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      setError(t('quiz.selectAnswer'));
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setSelectedAnswer(null);
    setError('');

    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitQuiz(newAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] !== -1 ? answers[currentQuestion - 1] : null);
      setError('');
    }
  };

  const handleSubmitQuiz = async (finalAnswers: number[], wasAutoSubmitted = false) => {
    setIsSubmitting(true);
    setError('');

    let timeSpent = null;
    if (quizStartTime) {
      timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
    }

    // Map shuffled answers back to original question order
    const originalOrderAnswers = new Array(finalAnswers.length).fill(-1);
    finalAnswers.forEach((answer, shuffledIndex) => {
      const originalIndex = questionMapping[shuffledIndex];
      originalOrderAnswers[originalIndex] = answer;
    });
    
    console.log('Shuffled answers:', finalAnswers);
    console.log('Original order answers:', originalOrderAnswers);
    console.log('Question mapping used:', questionMapping);

    try {
      const response = await fetch(`/api/quizzes/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: originalOrderAnswers,
          userName,
          timeSpent,
          wasAutoSubmitted,
        }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('quizResults', JSON.stringify(data.data));
        router.push(`/quiz/${params.id}/results`);
      } else {
        setError(data.error || 'Failed to submit quiz');
      }
    } catch (err) {
      setError(t('home.errors.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!quizData || shuffledQuestions.length === 0) {
    return <PageLoader text={t('quiz.loadingQuiz')} />;
  }

  const question = shuffledQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;

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
                  {quizData.title}
                </h1>
                <p className="text-xs text-gray-600">
                  {t('quiz.welcome')}, {userName}
                </p>
              </div>
            </div>

            {/* Timer - Mobile optimized */}
            {timeRemaining !== null && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white shadow-sm ${getTimeColor(timeRemaining, quizData.timeLimit! * 60)}`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{t('quiz.question')} {currentQuestion + 1} {t('quiz.of')} {shuffledQuestions.length}</span>
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
                  ID: {question._id.slice(-6)}
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
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && (
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
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0 || isSubmitting}
                  className="flex-1 h-11 sm:h-12"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t('quiz.previous')}
                </Button>

                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null || isSubmitting}
                  className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                                              <Loader2 className="w-4 h-4 animate-spin" />
                      {t('quiz.submitting')}
                    </div>
                  ) : currentQuestion === shuffledQuestions.length - 1 ? (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      {t('quiz.submit')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {t('quiz.next')}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Warning - Mobile optimized */}
        {timeRemaining !== null && timeRemaining <= 60 && timeRemaining > 0 && (
          <div className="flex-shrink-0 bg-red-50 border-t border-red-200 px-4 py-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t('quiz.warnings.timeWarning')} {Math.ceil(timeRemaining / 60)} {t('quiz.warnings.minute')} {t('quiz.warnings.remaining')}
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
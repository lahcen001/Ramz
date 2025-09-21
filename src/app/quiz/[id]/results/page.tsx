'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, CheckCircle, XCircle, Eye, EyeOff, RefreshCw, Home, Download } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { generateResultsPDF } from '@/lib/pdfUtils';

interface QuestionResult {
  questionIndex: number;
  questionText: string;
  userAnswerIndex: number;
  userAnswerText: string;
  correctAnswerIndex: number;
  correctAnswerText: string;
  isCorrect: boolean;
}

interface QuizResults {
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  results: QuestionResult[];
  quizTitle: string;
  schoolName: string;
  teacherName: string;
  major: string;
  timeSpent: number;
  quiz: {
    title: string;
    schoolName: string;
    teacherName: string;
    major: string;
  };
}

export default function QuizResultsPage() {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const fetchResults = useCallback(async () => {
    try {
      const nameFromUrl = searchParams.get('name');
      if (!nameFromUrl) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/quizzes/${params.id}/submissions?userName=${encodeURIComponent(nameFromUrl)}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
        
        // Set language from quiz
        if (data.data.quiz?.language && data.data.quiz.language !== i18n.language) {
          await i18n.changeLanguage(data.data.quiz.language);
        }
      } else {
        console.error('Results not found');
      }
    } catch {
      console.error('Failed to load results');
    }
  }, [params.id, searchParams, router, i18n]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleNewQuiz = () => {
    sessionStorage.clear();
    router.push('/');
  };

  const handleDownloadPDF = () => {
    if (!results) return;
    
    generateResultsPDF(
      {
        userName: results.userName,
        score: results.score,
        totalQuestions: results.totalQuestions,
        percentage: results.percentage,
        results: results.results,
        timeSpent: results.timeSpent,
      },
      {
        title: results.quiz.title,
        schoolName: results.quiz.schoolName,
        teacherName: results.quiz.teacherName,
        major: results.quiz.major,
      }
    );
  };

  if (!results) {
    return <PageLoader text={t('results.loadingResults')} />;
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return 'Excellent! 🎉';
    if (percentage >= 80) return 'Great job! 👏';
    if (percentage >= 70) return 'Good work! 👍';
    if (percentage >= 60) return 'Keep practicing! 📚';
    return 'Try again! 💪';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="min-h-screen flex flex-col lg:max-w-4xl lg:mx-auto">
        {/* Header - Compact */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-yellow-600 mr-2" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Quiz Results</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{results.quizTitle}</p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Results Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  results.percentage >= 80 ? 'bg-green-100' :
                  results.percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <Trophy className={`h-6 w-6 ${
                    results.percentage >= 80 ? 'text-green-600' :
                    results.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                {results.userName}&apos;s Score
              </CardTitle>
              <CardDescription className="text-sm">
                {getScoreMessage(results.percentage)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Score Display */}
              <div className="text-center">
                <div className={`text-5xl sm:text-6xl font-bold mb-2 ${getScoreColor(results.percentage)}`}>
                  {results.percentage}%
                </div>
                <div className="text-sm text-gray-700 mb-4">
                  {results.score} of {results.totalQuestions} correct
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      results.percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      results.percentage >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${results.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-600">{results.score}</div>
                  <div className="text-xs text-gray-600">Correct</div>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-red-600">{results.totalQuestions - results.score}</div>
                  <div className="text-xs text-gray-600">Wrong</div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Trophy className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-600">{results.totalQuestions}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full"
          >
            {showDetails ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Details
              </>
            )}
          </Button>

          {/* Question Details */}
          {showDetails && (
            <div className="space-y-3">
              {results.results.map((result, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        result.isCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {result.isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Q{index + 1}: {result.questionText}
                        </h4>
                        
                        <div className="space-y-1 text-xs">
                          <div className={`p-2 rounded ${result.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                            <span className="font-medium">Your answer: </span>
                            <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {result.userAnswerText}
                            </span>
                          </div>
                          
                          {!result.isCorrect && (
                            <div className="p-2 bg-green-50 rounded">
                              <span className="font-medium">Correct answer: </span>
                              <span className="text-green-700">{result.correctAnswerText}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {/* Download PDF Button */}
            <Button
              onClick={handleDownloadPDF}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('results.downloadPDF')}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                {t('results.home')}
              </Button>
              
              <Button
                onClick={handleNewQuiz}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t('results.takeAnother')}
              </Button>
            </div>
          </div>

          <p className="text-base text-gray-700 leading-relaxed">
            {t('quiz.results.description')} <strong>{results.quiz.title}</strong>. 
                                {t('quiz.results.reviewAnswers')}
          </p>
        </div>
      </div>
    </div>
  );
}

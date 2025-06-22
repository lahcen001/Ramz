'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Users, ArrowRight, Link, Clock, BookOpen } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { Loader2 } from 'lucide-react';

interface QuizInfo {
  _id: string;
  title: string;
  schoolName: string;
  teacherName: string;
  major: string;
  pin: string;
  language: string;
  questions: Array<{
    text: string;
    answers: string[];
    _id: string;
  }>;
  hasTimeLimit: boolean;
  timeLimit?: number;
}

export default function JoinQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);

  const fetchQuizInfo = useCallback(async () => {
    if (!params.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/quizzes/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setQuizInfo(data.data);
        if (data.data.language && data.data.language !== i18n.language) {
          await i18n.changeLanguage(data.data.language);
        }
      } else {
        setError(data.error || t('join.quizNotFound'));
      }
    } catch (err) {
      setError(t('home.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  }, [params.id, t, i18n]);

  useEffect(() => {
    fetchQuizInfo();
  }, [fetchQuizInfo]);

  useEffect(() => {
    if (quizInfo && userName.trim() && !isSubmitting && !isLoading) {
      const timer = setTimeout(() => {
        handleJoinQuiz();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [userName, quizInfo, isSubmitting, isLoading]);

  const handleJoinQuiz = async () => {
    if (!userName.trim() || !quizInfo) {
      setError(t('home.errors.nameRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/quizzes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: quizInfo.pin,
          userName: userName.trim(),
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        sessionStorage.setItem('userName', userName.trim());
        sessionStorage.setItem('quizData', JSON.stringify(result.data));
        router.push(`/quiz/${result.data._id}`);
      } else {
        setError(result.error || 'Failed to join quiz');
      }
    } catch (err) {
      setError(t('home.errors.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError('');
    fetchQuizInfo();
  };

  if (isLoading) {
    return <PageLoader text={t('common.loading')} />;
  }

  if (error && !quizInfo) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('common.error')}</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRetry} className="w-full">
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizInfo) return null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Responsive Layout */}
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 lg:py-12">
        {/* Header - Compact */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 animate-pulse"></div>
              <div className="relative bg-white rounded-lg p-2 sm:p-3 shadow-lg">
                <Target className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <h1 className="text-lg sm:text-xl font-bold text-green-800">{t('join.directLink')}</h1>
          </div>
          
          <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
            {t('join.enterNameToStart')}
          </p>
        </div>

        {/* Main Card - Mobile optimized */}
        <div className="w-full max-w-sm sm:max-w-md">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">
                {quizInfo.title}
              </CardTitle>
              <CardDescription className="space-y-1">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{quizInfo.schoolName}</span>
                  {quizInfo.teacherName && (
                    <span> • {quizInfo.teacherName}</span>
                  )}
                </div>
                {quizInfo.major && (
                  <div className="text-sm text-gray-500">{quizInfo.major}</div>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6">
              {/* Quiz Info - Compact */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <BookOpen className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-900">
                    {quizInfo.questions?.length || 0}
                  </div>
                  <div className="text-xs text-blue-700">Questions</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3">
                  <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-900">
                    {quizInfo.hasTimeLimit && quizInfo.timeLimit ? `${quizInfo.timeLimit}m` : '∞'}
                  </div>
                  <div className="text-xs text-purple-700">Time Limit</div>
                </div>
              </div>

              {/* Name Input Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleJoinQuiz(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-sm font-medium text-gray-700">
                    {t('home.yourName')}
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder={t('home.yourNamePlaceholder')}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 sm:h-14 text-lg sm:text-xl border-2 focus:border-blue-500 transition-colors text-center"
                    autoFocus
                  />
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Auto-start info */}
                {userName.trim() && !isSubmitting && (
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      {t('join.autoStartDescription')}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!userName.trim() || isSubmitting}
                  className="w-full h-12 sm:h-14 text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('home.startingQuiz')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {t('home.startQuiz')}
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Features - Compact */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <ArrowRight className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="text-xs text-gray-600">{t('join.instantAccess')}</div>
                  </div>
                  <div>
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Link className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="text-xs text-gray-600">{t('join.noPin')}</div>
                  </div>
                  <div>
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Users className="h-3 w-3 text-purple-600" />
                    </div>
                    <div className="text-xs text-gray-600">{t('join.autoStart')}</div>
                  </div>
                </div>
              </div>

              {/* Admin Link - Compact */}
              <div className="text-center pt-2 sm:pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/admin/login')}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t('home.adminAccess')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
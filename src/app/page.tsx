'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Target, Users, BookOpen, Clock, Link, ArrowRight, Globe, Trophy } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleJoinQuiz = useCallback(async (joinPin?: string, joinName?: string) => {
    const quizPin = joinPin || pin;
    const userName = joinName || name;
    
    if (!quizPin.trim() || !userName.trim()) {
      setError(t('home.errors.fillAllFields'));
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await fetch('/api/quizzes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: quizPin.trim().toUpperCase(),
          userName: userName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Set language from teacher's selection
        if (data.data.language && data.data.language !== i18n.language) {
          await i18n.changeLanguage(data.data.language);
        }
        
        router.push(`/quiz/${data.data.quizId}?name=${encodeURIComponent(userName.trim())}`);
      } else {
        setError(data.error || t('home.errors.failedToJoin'));
      }
    } catch {
      setError(t('home.errors.networkError'));
    } finally {
      setIsJoining(false);
    }
  }, [pin, name, t, i18n, router]);

  useEffect(() => {
    const urlPin = searchParams.get('pin');
    const urlName = searchParams.get('name');
    
    if (urlPin && urlName) {
      setPin(urlPin);
      setName(urlName);
      handleJoinQuiz(urlPin, urlName);
    }
  }, [searchParams, handleJoinQuiz]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Language Switcher - Fixed position for mobile */}
      <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 z-10">
        <LanguageSwitcher />
      </div>

      {/* Mobile-First Layout with Desktop Support */}
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 lg:py-12">
        {/* Header Section - Compact for mobile */}
        <div className="text-center mb-6 sm:mb-8">
          {/* Logo/Title - Smaller on mobile */}
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 animate-pulse"></div>
              <div className="relative bg-white rounded-lg p-2 sm:p-3 shadow-lg">
                <Target className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            {t('app.title')}
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-sm sm:max-w-md mx-auto">
            {t('app.subtitle')}
          </p>
        </div>

        {/* Main Form Card - Responsive for all devices */}
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                {t('home.title')}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">
                {t('home.description')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 sm:space-y-6">
              <form onSubmit={() => handleJoinQuiz(pin, name)} className="space-y-4 sm:space-y-6">
                {/* Shared link info - Compact for mobile */}
                {searchParams.get('pin') && (
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Link className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">{t('home.sharedLink.title')}</span>
                    </div>
                    <p className="text-xs text-green-700">{t('home.sharedLink.description')}</p>
                  </div>
                )}

                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-sm font-medium text-gray-700 rtl:text-right">
                    {t('home.yourName')}
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder={t('home.yourNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isJoining}
                    className="h-12 sm:h-14 text-lg sm:text-xl border-2 focus:border-blue-500 transition-colors rtl:text-right rtl:placeholder:text-right"
                    autoFocus={searchParams.get('pin') ? true : false}
                  />
                </div>
                
                {/* PIN Input - Only show if not provided via URL */}
                {!searchParams.get('pin') && (
                  <div className="space-y-2">
                    <Label htmlFor="pin" className="text-sm font-medium text-gray-700 rtl:text-right">
                      {t('home.quizPin')}
                    </Label>
                    <Input
                      id="pin"
                      type="text"
                      placeholder={t('home.quizPinPlaceholder')}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.toUpperCase())}
                      disabled={isJoining}
                      className="h-12 sm:h-14 text-lg sm:text-xl border-2 focus:border-blue-500 transition-colors font-mono tracking-wider text-center"
                      maxLength={6}
                    />
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isJoining || !name.trim() || !pin.trim()}
                  className="w-full h-12 sm:h-14 text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isJoining ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('common.loading')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {searchParams.get('pin') ? t('home.startQuiz') : t('home.joinQuiz')}
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>


            </CardContent>
          </Card>
        </div>

        {/* Features - Responsive for all devices */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8 lg:mt-12 max-w-6xl w-full">
          {[
            { icon: BookOpen, title: t('home.features.interactive.title'), desc: t('home.features.interactive.description'), color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Clock, title: t('home.features.timed.title'), desc: t('home.features.timed.description'), color: 'text-green-600', bg: 'bg-green-50' },
            { icon: Globe, title: t('home.features.multilingual.title'), desc: t('home.features.multilingual.description'), color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: Trophy, title: t('home.features.results.title'), desc: t('home.features.results.description'), color: 'text-yellow-600', bg: 'bg-yellow-50' }
          ].map((feature, index) => (
            <div key={index} className={`text-center p-3 sm:p-4 lg:p-6 ${feature.bg} rounded-lg lg:rounded-xl backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow`}>
              <feature.icon className={`h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 ${feature.color} mx-auto mb-2 sm:mb-3`} />
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 hidden sm:block">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

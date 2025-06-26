'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Lock, ArrowRight, Home, User, Globe } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { t, i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    language: i18n.language || 'en',
    schoolName: '',
    teacherName: '',
    major: '',
    hasTimeLimit: false,
    defaultTimeLimit: 30,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setFormData(prev => ({ ...prev, language: i18n.language }));
  }, [i18n.language]);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError(t('admin.auth.emailRequired'));
      return false;
    }
    
    if (!formData.password.trim()) {
      setError(t('admin.auth.passwordRequired'));
      return false;
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        setError(t('admin.auth.nameRequired'));
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError(t('admin.auth.passwordsDoNotMatch'));
        return false;
      }
      
      if (formData.password.length < 6) {
        setError(t('admin.auth.passwordTooShort'));
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Set language from admin profile
        if (data.admin?.language && data.admin.language !== i18n.language) {
          await i18n.changeLanguage(data.admin.language);
        }
        
        router.push('/admin');
      } else {
        setError(data.error || (isLogin ? t('admin.auth.loginFailed') : t('admin.auth.registrationFailed')));
      }
    } catch {
      setError(t('home.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Language Switcher - Only show on auth form */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Responsive Layout */}
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 lg:py-12">
        {/* Header - Compact */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-blue-600 rounded-lg blur opacity-25 animate-pulse"></div>
              <div className="relative bg-white rounded-lg p-2 sm:p-3 shadow-lg">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-gray-600" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? t('admin.auth.loginTitle') : t('admin.auth.registerTitle')}
          </h1>
          
          <p className="text-sm sm:text-base text-gray-600">
            {isLogin ? t('admin.auth.loginSubtitle') : t('admin.auth.registerSubtitle')}
          </p>
        </div>

        {/* Auth Card - Mobile optimized */}
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                {isLogin ? t('admin.auth.secureLogin') : t('admin.auth.createAccount')}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">
                {isLogin ? t('admin.auth.enterCredentials') : t('admin.auth.setupProfile')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    {t('admin.auth.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('admin.auth.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                    className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                </div>

                {/* Name Input - Only for registration */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      {t('admin.auth.fullName')}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('admin.auth.namePlaceholder')}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {t('admin.auth.password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('admin.auth.passwordPlaceholder')}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoading}
                    className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Confirm Password - Only for registration */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      {t('admin.auth.confirmPassword')}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t('admin.auth.confirmPasswordPlaceholder')}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}

                {/* Language Selection - Only for registration */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('admin.auth.preferredLanguage')}
                    </Label>
                    <Select 
                      value={formData.language} 
                      onValueChange={(value) => {
                        handleInputChange('language', value);
                        i18n.changeLanguage(value);
                      }}
                    >
                      <SelectTrigger className="h-12 text-base border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Profile Information - Only for registration */}
                {!isLogin && (
                  <>
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('admin.auth.profileInformation')}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* School Name */}
                        <div className="space-y-2">
                          <Label htmlFor="schoolName" className="text-sm font-medium text-gray-700">
                            {t('admin.create.schoolName')}
                          </Label>
                          <Input
                            id="schoolName"
                            type="text"
                            placeholder={t('admin.create.schoolNamePlaceholder')}
                            value={formData.schoolName}
                            onChange={(e) => handleInputChange('schoolName', e.target.value)}
                            disabled={isLoading}
                            className="h-10 text-sm border-2 focus:border-blue-500 transition-colors"
                          />
                        </div>

                        {/* Teacher Name */}
                        <div className="space-y-2">
                          <Label htmlFor="teacherName" className="text-sm font-medium text-gray-700">
                            {t('admin.create.teacherName')}
                          </Label>
                          <Input
                            id="teacherName"
                            type="text"
                            placeholder={t('admin.create.teacherNamePlaceholder')}
                            value={formData.teacherName}
                            onChange={(e) => handleInputChange('teacherName', e.target.value)}
                            disabled={isLoading}
                            className="h-10 text-sm border-2 focus:border-blue-500 transition-colors"
                          />
                        </div>

                        {/* Major/Subject */}
                        <div className="space-y-2">
                          <Label htmlFor="major" className="text-sm font-medium text-gray-700">
                            {t('admin.create.majorSubject')}
                          </Label>
                          <Input
                            id="major"
                            type="text"
                            placeholder={t('admin.create.majorPlaceholder')}
                            value={formData.major}
                            onChange={(e) => handleInputChange('major', e.target.value)}
                            disabled={isLoading}
                            className="h-10 text-sm border-2 focus:border-blue-500 transition-colors"
                          />
                        </div>

                        {/* Default Time Limit */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="hasTimeLimit"
                              checked={formData.hasTimeLimit}
                              onChange={(e) => handleInputChange('hasTimeLimit', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Label htmlFor="hasTimeLimit" className="text-sm font-medium text-gray-700">
                              {t('admin.auth.setDefaultTimeLimit')}
                            </Label>
                          </div>
                          
                          {formData.hasTimeLimit && (
                            <div className="space-y-2">
                              <Label htmlFor="defaultTimeLimit" className="text-sm font-medium text-gray-700">
                                {t('admin.create.timeLimitMinutes')}
                              </Label>
                              <Input
                                id="defaultTimeLimit"
                                type="number"
                                min="1"
                                max="300"
                                placeholder="30"
                                value={formData.defaultTimeLimit}
                                onChange={(e) => handleInputChange('defaultTimeLimit', parseInt(e.target.value) || 30)}
                                disabled={isLoading}
                                className="h-10 text-sm border-2 focus:border-blue-500 transition-colors"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
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
                  disabled={isLoading}
                  className="w-full h-12 sm:h-14 text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-600 to-blue-600 hover:from-gray-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isLogin ? t('admin.auth.signingIn') : t('admin.auth.creatingAccount')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isLogin ? t('admin.auth.signIn') : t('admin.auth.createAccount')}
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Toggle between login and register */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  {isLogin ? t('admin.auth.noAccount') : t('admin.auth.haveAccount')}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setFormData(prev => ({
                      ...prev,
                      password: '',
                      confirmPassword: '',
                    }));
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {isLogin ? t('admin.auth.createAccountLink') : t('admin.auth.signInLink')}
                </Button>
              </div>

              {/* Back to Home Link */}
              <div className="text-center pt-2 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/')}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  {t('common.backToHome')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
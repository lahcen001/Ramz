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
import { User, Globe, School, GraduationCap, Clock, ArrowLeft, Save, Settings } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { Loader2 } from 'lucide-react';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  language: string;
  adminProfile?: {
    schoolName?: string;
    teacherName?: string;
    major?: string;
    hasDefaultTimeLimit?: boolean;
    defaultTimeLimit?: number;
  };
}

export default function AdminProfilePage() {
  const { t, i18n } = useTranslation();
  const [profileData, setProfileData] = useState({
    language: 'en',
    schoolName: '',
    teacherName: '',
    major: '',
    hasTimeLimit: false,
    defaultTimeLimit: 30,
  });
  const [adminInfo, setAdminInfo] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/admin');
      const data = await response.json();
      
      if (data.authenticated && data.admin) {
        setIsAuthenticated(true);
        setAdminInfo(data.admin);
        
        // Set form data from admin profile
        setProfileData({
          language: data.admin.language || 'en',
          schoolName: data.admin.adminProfile?.schoolName || '',
          teacherName: data.admin.adminProfile?.teacherName || '',
          major: data.admin.adminProfile?.major || '',
          hasTimeLimit: data.admin.adminProfile?.hasDefaultTimeLimit || false,
          defaultTimeLimit: data.admin.adminProfile?.defaultTimeLimit || 30,
        });
        
        // Set language
        if (data.admin.language && data.admin.language !== i18n.language) {
          await i18n.changeLanguage(data.admin.language);
        }
      } else {
        router.push('/admin/login');
      }
    } catch (err) {
      router.push('/admin/login');
    } finally {
      setCheckingAuth(false);
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleLanguageChange = async (language: string) => {
    setProfileData(prev => ({ ...prev, language }));
    await i18n.changeLanguage(language);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: profileData.language,
          schoolName: profileData.schoolName,
          teacherName: profileData.teacherName,
          major: profileData.major,
          hasTimeLimit: profileData.hasTimeLimit,
          defaultTimeLimit: profileData.hasTimeLimit ? profileData.defaultTimeLimit : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t('admin.profile.updateSuccess'));
        setAdminInfo(data.admin);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || t('admin.profile.updateFailed'));
      }
    } catch (err) {
      setError(t('home.errors.networkError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingAuth) {
    return <PageLoader text={t('admin.dashboard.checkingAuth')} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <PageLoader text={t('admin.profile.loading')} />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="min-h-screen flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">{t('common.back')}</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {t('admin.profile.title')}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                  {t('admin.profile.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto">
          {/* Account Information */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-6 w-6 text-blue-600" />
                {t('admin.profile.accountInfo')}
              </CardTitle>
              <CardDescription>
                {t('admin.profile.accountDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('admin.auth.fullName')}
                  </Label>
                  <Input
                    value={adminInfo?.name || ''}
                    disabled
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('admin.auth.email')}
                  </Label>
                  <Input
                    value={adminInfo?.email || ''}
                    disabled
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Preferences */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Globe className="h-6 w-6 text-green-600" />
                {t('admin.profile.languagePreferences')}
              </CardTitle>
              <CardDescription>
                {t('admin.profile.languageDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t('admin.auth.preferredLanguage')}
                </Label>
                <Select 
                  value={profileData.language} 
                  onValueChange={handleLanguageChange}
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
                <p className="text-sm text-gray-600">
                  {t('admin.profile.languageNote')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Default Quiz Information */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="h-6 w-6 text-purple-600" />
                {t('admin.profile.defaultQuizInfo')}
              </CardTitle>
              <CardDescription>
                {t('admin.profile.defaultQuizDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName" className="text-sm font-medium text-gray-700">
                    {t('admin.create.schoolName')}
                  </Label>
                  <Input
                    id="schoolName"
                    value={profileData.schoolName}
                    onChange={(e) => handleInputChange('schoolName', e.target.value)}
                    placeholder={t('admin.create.schoolNamePlaceholder')}
                    className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacherName" className="text-sm font-medium text-gray-700">
                    {t('admin.create.teacherName')}
                  </Label>
                  <Input
                    id="teacherName"
                    value={profileData.teacherName}
                    onChange={(e) => handleInputChange('teacherName', e.target.value)}
                    placeholder={t('admin.create.teacherNamePlaceholder')}
                    className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="major" className="text-sm font-medium text-gray-700">
                  {t('admin.create.majorSubject')}
                </Label>
                <Input
                  id="major"
                  value={profileData.major}
                  onChange={(e) => handleInputChange('major', e.target.value)}
                  placeholder={t('admin.create.majorPlaceholder')}
                  className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Default Time Limit */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasTimeLimit"
                    checked={profileData.hasTimeLimit}
                    onChange={(e) => handleInputChange('hasTimeLimit', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="hasTimeLimit" className="text-sm font-medium text-gray-700">
                    {t('admin.auth.setDefaultTimeLimit')}
                  </Label>
                </div>
                
                {profileData.hasTimeLimit && (
                  <div className="space-y-2">
                    <Label htmlFor="defaultTimeLimit" className="text-sm font-medium text-gray-700">
                      {t('admin.create.timeLimitMinutes')}
                    </Label>
                    <Input
                      id="defaultTimeLimit"
                      type="number"
                      min="1"
                      max="300"
                      value={profileData.defaultTimeLimit}
                      onChange={(e) => handleInputChange('defaultTimeLimit', parseInt(e.target.value) || 30)}
                      className="h-12 text-base border-2 focus:border-blue-500 transition-colors max-w-xs"
                    />
                    <p className="text-sm text-gray-600">
                      {t('admin.profile.timeLimitNote')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex justify-center pb-8">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('admin.profile.saving')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  {t('admin.profile.saveChanges')}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
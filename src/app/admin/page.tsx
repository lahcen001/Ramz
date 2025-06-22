'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, BookOpen, Users, Clock, Pin, Trash2, Target, Link, Check, LogOut, Upload, FileText, Download, User, Eye, Loader2 } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';

interface Quiz {
  _id: string;
  title: string;
  schoolName: string;
  teacherName: string;
  major: string;
  pin: string;
  questions: any[];
  createdAt: string;
  hasTimeLimit: boolean;
  timeLimit?: number;
}

interface CSVQuestion {
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  correctAnswer: number;
}

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

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<CSVQuestion[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setAdminProfile(data.admin);
        
        if (data.admin.language && data.admin.language !== i18n.language) {
          await i18n.changeLanguage(data.admin.language);
        }
        
        fetchQuizzes();
      } else {
        router.push('/admin/login');
      }
    } catch (err) {
      router.push('/admin/login');
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/quizzes');
      const data = await response.json();

      if (data.success) {
        setQuizzes(data.data);
      } else {
        setError('Failed to fetch quizzes');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
      } else {
        setError('Failed to delete quiz');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleCopyQuizLink = async (quizPin: string, quizId: string) => {
    try {
      const baseUrl = window.location.origin;
      const quizLink = `${baseUrl}/join/${quizId}`;
      
      await navigator.clipboard.writeText(quizLink);
      setCopiedQuizId(quizId);
      
      setTimeout(() => {
        setCopiedQuizId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/join/${quizId}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedQuizId(quizId);
      setTimeout(() => {
        setCopiedQuizId(null);
      }, 2000);
    }
  };

  const parseCSV = (text: string): CSVQuestion[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const questions: CSVQuestion[] = [];
    
    const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = parseCSVLine(line);
      
      if (columns.length >= 6) {
        const correctAnswer = parseInt(columns[5]) || 1;
        if (correctAnswer >= 1 && correctAnswer <= 4) {
          questions.push({
            question: columns[0].trim(),
            answer1: columns[1].trim(),
            answer2: columns[2].trim(),
            answer3: columns[3].trim(),
            answer4: columns[4].trim(),
            correctAnswer: correctAnswer - 1
          });
        }
      }
    }
    
    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    
    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const questions = parseCSV(text);
        setImportPreview(questions);
        setError('');
      } catch (err) {
        setError('Error parsing CSV file. Please check the format.');
        setImportPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sampleData = `Question,Answer 1,Answer 2,Answer 3,Answer 4,Correct Answer (1-4)
"What is the capital of France?","Paris","London","Berlin","Madrid",1
"Which planet is closest to the Sun?","Venus","Mercury","Earth","Mars",2
"What is 2 + 2?","3","4","5","6",2`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImportQuestions = async () => {
    if (!csvFile || importPreview.length === 0) {
      setError('Please select a valid CSV file with questions');
      return;
    }
    
    setIsImporting(true);
    try {
      localStorage.setItem('importedQuestions', JSON.stringify(importPreview));
      setIsImportDialogOpen(false);
      router.push('/admin/create?imported=true');
    } catch (err) {
      setError('Failed to import questions. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setCsvFile(null);
    setImportPreview([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (checkingAuth) {
    return <PageLoader text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <PageLoader text="Loading quizzes..." />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="min-h-screen flex flex-col max-w-7xl mx-auto">
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 animate-pulse"></div>
                <div className="relative bg-white rounded-lg p-2 lg:p-3 shadow-lg">
                  <Target className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {t('admin.title')}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                  {t('admin.subtitle')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <Target className="h-5 w-5" />
                {t('common.backToHome')}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/profile')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 lg:px-4 py-2"
              >
                <User className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">{t('admin.profile.title')}</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 lg:px-4 py-2"
              >
                <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">{t('admin.dashboard.logout')}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Button 
                onClick={() => router.push('/admin/create')}
                className="w-full h-14 lg:h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base lg:text-lg"
              >
                <Plus className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
                {t('admin.dashboard.createNewQuiz')}
              </Button>

              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="w-full h-12 lg:h-14 border-2 border-green-300 hover:border-green-500 hover:bg-green-50 text-green-700 hover:text-green-800 transition-all duration-300 text-base lg:text-lg"
                  >
                    <Upload className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
                    {t('admin.dashboard.importFromCSV')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl lg:text-2xl">
                      <FileText className="h-6 w-6 text-green-600" />
                      {t('admin.dashboard.csvImport.title')}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {t('admin.dashboard.csvImport.description')}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <h4 className="font-semibold text-blue-900">{t('admin.dashboard.csvImport.needHelp')}</h4>
                        <p className="text-sm text-blue-700">{t('admin.dashboard.csvImport.downloadSample')}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={downloadSampleCSV}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t('admin.dashboard.csvImport.downloadSampleButton')}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="csv-file" className="text-base font-semibold">
                        {t('admin.dashboard.csvImport.selectFile')}
                      </Label>
                      <Input
                        ref={fileInputRef}
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="h-12 text-base"
                      />
                      {csvFile && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          File selected: {csvFile.name}
                        </div>
                      )}
                    </div>

                    {importPreview.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">Preview Questions ({importPreview.length})</h4>
                          <Button
                            variant="ghost"
                            onClick={resetImport}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Reset
                          </Button>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto space-y-3 border rounded-lg p-4 bg-gray-50">
                          {importPreview.slice(0, 5).map((question, index) => (
                            <Card key={index} className="bg-white">
                              <CardContent className="p-4">
                                <h5 className="font-semibold mb-2">Q{index + 1}: {question.question}</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className={`p-2 rounded ${question.correctAnswer === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                    A: {question.answer1}
                                  </div>
                                  <div className={`p-2 rounded ${question.correctAnswer === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                    B: {question.answer2}
                                  </div>
                                  <div className={`p-2 rounded ${question.correctAnswer === 2 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                    C: {question.answer3}
                                  </div>
                                  <div className={`p-2 rounded ${question.correctAnswer === 3 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                    D: {question.answer4}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {importPreview.length > 5 && (
                            <div className="text-center text-gray-600 text-sm">
                              ... and {importPreview.length - 5} more questions
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsImportDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImportQuestions}
                        disabled={importPreview.length === 0 || isImporting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Import {importPreview.length} Questions
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 lg:p-6 text-center">
                  <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mx-auto mb-2 lg:mb-3" />
                  <div className="text-2xl lg:text-3xl font-bold text-blue-900">{quizzes.length}</div>
                  <div className="text-xs lg:text-sm text-gray-600">Total Quizzes</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 lg:p-6 text-center">
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 text-green-600 mx-auto mb-2 lg:mb-3" />
                  <div className="text-2xl lg:text-3xl font-bold text-green-900">
                    {quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0)}
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">Total Questions</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700 text-sm lg:text-base">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 lg:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                Your Quizzes
              </h2>
              <div className="text-sm lg:text-base text-gray-600">
                {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}
              </div>
            </div>

            {quizzes.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8 lg:p-12 text-center">
                  <div className="relative mb-6">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-blue-400 rounded-full blur opacity-25"></div>
                    <div className="relative bg-white rounded-full p-4 lg:p-6 shadow-lg">
                      <BookOpen className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto" />
                    </div>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">
                    {t('admin.dashboard.noQuizzes')}
                  </h3>
                  <p className="text-gray-600 mb-6 lg:mb-8 text-base lg:text-lg">
                    {t('admin.dashboard.createFirst')}
                  </p>
                  <Button 
                    onClick={() => router.push('/admin/create')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg"
                  >
                    <Plus className="h-5 w-5 lg:h-6 lg:w-6 mr-2" />
                    {t('admin.dashboard.createQuiz')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {quizzes.map((quiz) => (
                  <Card key={quiz._id} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-start justify-between mb-4 lg:mb-6">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base lg:text-lg truncate group-hover:text-blue-900 transition-colors">
                            {quiz.title}
                          </h3>
                          <p className="text-sm lg:text-base text-gray-600 truncate mt-1">
                            {quiz.schoolName}
                          </p>
                          <p className="text-xs lg:text-sm text-gray-500 mt-1">
                            {quiz.teacherName} • {quiz.major}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-3 bg-blue-50 rounded-lg px-2 lg:px-3 py-1 lg:py-2">
                          <Pin className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                          <span className="text-sm lg:text-base font-mono font-semibold text-blue-900">
                            {quiz.pin}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 lg:gap-6 mb-4 lg:mb-6 text-sm lg:text-base text-gray-600">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                          <span>{quiz.questions.length} {t('admin.dashboard.questions')}</span>
                        </div>
                        {quiz.hasTimeLimit && quiz.timeLimit && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                            <span>{quiz.timeLimit}m {t('admin.dashboard.timer')}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 lg:space-y-3">
                        <div className="grid grid-cols-2 gap-2 lg:gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyQuizLink(quiz.pin, quiz._id)}
                            className="text-sm lg:text-base h-9 lg:h-10 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
                          >
                            {copiedQuizId === quiz._id ? (
                              <>
                                <Check className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-600" />
                                <span className="text-green-600">{t('admin.dashboard.linkCopied')}</span>
                              </>
                            ) : (
                              <>
                                <Link className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                                {t('admin.dashboard.share')}
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/quiz/${quiz._id}/participants`)}
                            className="text-sm lg:text-base h-9 lg:h-10 transition-all duration-200 hover:bg-green-50 hover:border-green-300"
                          >
                            <Eye className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                            {t('admin.dashboard.participants')}
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-sm lg:text-base h-9 lg:h-10 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                          {t('admin.dashboard.delete')}
                        </Button>
                      </div>

                      <div className="hidden lg:block mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {t('admin.dashboard.created')}: {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="lg:hidden pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full h-12 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-200"
            >
              <Target className="h-5 w-5 mr-2" />
              {t('common.backToHome')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
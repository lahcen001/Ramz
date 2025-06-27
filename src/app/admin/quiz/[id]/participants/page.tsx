'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/loader';
import { Download, ArrowLeft, Target, Users, TrendingUp, Trophy, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { generateBulkResultsPDF } from '@/lib/pdfUtils';

interface QuizSubmission {
  _id: string;
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  submittedAt: string;
  timeSpent?: number;
  wasAutoSubmitted?: boolean;
  results: {
    questionIndex: number;
    questionText: string;
    userAnswerIndex: number;
    userAnswerText: string;
    correctAnswerIndex: number;
    correctAnswerText: string;
    isCorrect: boolean;
  }[];
}

interface QuizInfo {
  _id: string;
  title: string;
  pin: string;
  schoolName: string;
  teacherName: string;
  major: string;
}

interface ParticipantsData {
  quiz: QuizInfo;
  submissions: QuizSubmission[];
}

export default function QuizParticipantsPage() {
  const [data, setData] = useState<ParticipantsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const router = useRouter();
  const params = useParams();

  const fetchParticipants = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/quizzes/${params.id}/submissions`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError('Failed to fetch participants');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const toggleSubmissionDetails = (submissionId: string) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedSubmissions(newExpanded);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleDownloadBulkPDF = () => {
    if (!data?.submissions || data.submissions.length === 0) return;
    
    const bulkData = {
      quizTitle: data.quiz.title,
      schoolName: data.quiz.schoolName,
      teacherName: data.quiz.teacherName,
      major: data.quiz.major,
      totalQuestions: data.submissions[0]?.totalQuestions || 0,
      students: data.submissions.map(submission => ({
        userName: submission.userName,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage,
        results: submission.results,
        timeSpent: submission.timeSpent,
      })),
    };
    
    generateBulkResultsPDF(bulkData);
  };

  if (isLoading) {
    return <PageLoader text="Loading participants..." />;
  }

  if (!data) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-gray-600">Quiz not found</p>
            <Button onClick={() => router.push('/admin')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const averageScore = data?.submissions?.length > 0 
    ? data.submissions.reduce((sum, sub) => sum + sub.percentage, 0) / data.submissions.length 
    : 0;

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="h-full flex flex-col sm:max-w-6xl sm:mx-auto">
        {/* Header - Fixed for mobile */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Target className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Participants</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {data?.quiz?.title} • PIN: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{data?.quiz?.pin}</code>
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {data?.submissions?.length > 0 && (
                <Button 
                  size="sm"
                  onClick={handleDownloadBulkPDF}
                  className="h-8 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              )}
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
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Summary Stats - Mobile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">{data?.submissions?.length || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Participants</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className={`text-lg sm:text-2xl font-bold ${getScoreColor(averageScore)}`}>
                        {averageScore.toFixed(1)}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Average</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-green-600">
                        {data?.submissions?.filter(s => s.percentage >= 80).length || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Excellent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-red-600">
                        {data?.submissions?.filter(s => s.percentage < 60).length || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Need Help</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Participants List */}
            {data?.submissions?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No participants yet</h3>
                  <p className="text-sm text-gray-600">
                    Share the quiz PIN with students to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Participant Results ({data?.submissions?.length})
                </h2>
                <div className="space-y-3">
                  {data?.submissions?.map((submission) => (
                    <Card key={submission._id} className="hover:shadow-md transition-shadow">
                      <CardHeader 
                        className="pb-3 cursor-pointer"
                        onClick={() => toggleSubmissionDetails(submission._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base sm:text-lg truncate">{submission.userName}</CardTitle>
                                <CardDescription className="text-sm">
                                  Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                                  {submission.timeSpent && ` • ${Math.round(submission.timeSpent / 60)}m ${submission.timeSpent % 60}s`}
                                  {submission.wasAutoSubmitted && ' • Auto-submitted'}
                                </CardDescription>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`text-lg sm:text-xl font-bold ${getScoreColor(submission.percentage)}`}>
                                  {submission.score}/{submission.totalQuestions}
                                </div>
                                <div className={`text-sm ${getScoreColor(submission.percentage)}`}>
                                  {submission.percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            {expandedSubmissions.has(submission._id) ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedSubmissions.has(submission._id) && (
                        <CardContent className="pt-0">
                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Detailed Results</h4>
                            <div className="space-y-3">
                              {submission.results.map((result, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                      result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 mb-2">{result.questionText}</p>
                                      <div className="space-y-1 text-xs">
                                        <div className={`${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                          <strong>Your answer:</strong> {result.userAnswerText}
                                        </div>
                                        {!result.isCorrect && (
                                          <div className="text-green-700">
                                            <strong>Correct answer:</strong> {result.correctAnswerText}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
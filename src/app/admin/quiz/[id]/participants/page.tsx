'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/loader';
import { Download } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">Quiz not found</p>
            <Button onClick={() => router.push('/admin')}>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quiz Participants</h1>
            <p className="text-gray-600 mt-2">
              {data?.quiz?.title} • PIN: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{data?.quiz?.pin}</code>
            </p>
          </div>
          <div className="flex gap-2">
            {data?.submissions?.length > 0 && (
              <Button 
                onClick={handleDownloadBulkPDF}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All Results PDF
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{data?.submissions?.length || 0}</div>
              <div className="text-sm text-gray-600">Total Participants</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                {averageScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {data?.submissions?.filter(s => s.percentage >= 80).length || 0}
              </div>
              <div className="text-sm text-gray-600">Excellent (80%+)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {data?.submissions?.filter(s => s.percentage < 60).length || 0}
              </div>
              <div className="text-sm text-gray-600">Need Improvement (&lt;60%)</div>
            </CardContent>
          </Card>
        </div>

        {/* Participants List */}
        <Card>
          <CardHeader>
            <CardTitle>All Participants ({data?.submissions?.length || 0})</CardTitle>
            <CardDescription>
              Click on a participant to view detailed results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.submissions || data.submissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No participants yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Share the PIN code <code className="bg-gray-100 px-2 py-1 rounded">{data?.quiz?.pin}</code> with students
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.submissions.map((submission) => (
                  <div key={submission._id} className="border rounded-lg p-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSubmissionDetails(submission._id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-medium text-lg">{submission.userName}</div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          submission.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          submission.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {submission.percentage}% ({submission.score}/{submission.totalQuestions})
                        </div>
                        {submission.timeSpent && (
                          <div className="text-sm text-gray-600">
                            Time: {Math.floor(submission.timeSpent / 60)}:{(submission.timeSpent % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                        {submission.wasAutoSubmitted && (
                          <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Auto-submitted
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </span>
                        <Button variant="ghost" size="sm">
                          {expandedSubmissions.has(submission._id) ? '▼' : '▶'}
                        </Button>
                      </div>
                    </div>

                    {expandedSubmissions.has(submission._id) && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3">Detailed Results:</h4>
                        <div className="space-y-3">
                          {submission.results.map((result, index) => (
                            <div key={index} className="border rounded p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="font-medium text-sm bg-gray-100 px-2 py-1 rounded">
                                  Q{result.questionIndex + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium">{result.questionText}</p>
                                </div>
                                <div className={`text-sm font-medium px-2 py-1 rounded ${
                                  result.isCorrect 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.isCorrect ? '✓' : '✗'}
                                </div>
                              </div>
                              
                              <div className="pl-4 space-y-1 text-sm">
                                <div className={`${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                  Student answer: {result.userAnswerText}
                                </div>
                                {!result.isCorrect && (
                                  <div className="text-green-700">
                                    Correct answer: {result.correctAnswerText}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, BookOpen, Edit, Trash2, GraduationCap, Target, ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface ClassData {
  _id: string;
  name: string;
  description: string;
  schoolName: string;
  teacherName: string;
  grade: string;
  subject: string;
  students: Array<{
    name: string;
    email?: string;
    studentId?: string;
    addedAt: Date;
  }>;
  quizzes: string[];
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ClassesPage() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schoolName: '',
    teacherName: '',
    grade: '',
    subject: '',
    language: i18n.language,
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/classes');
      const result = await response.json();

      if (result.success) {
        setClasses(result.data);
      } else {
        setError('Failed to fetch classes');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setClasses([result.data, ...classes]);
        setIsCreateModalOpen(false);
        setFormData({
          name: '',
          description: '',
          schoolName: '',
          teacherName: '',
          grade: '',
          subject: '',
          language: i18n.language,
        });
      } else {
        setError(result.error || 'Failed to create class');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setClasses(classes.filter(c => c._id !== classId));
      } else {
        setError(result.error || 'Failed to delete class');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  if (isLoading) {
    return <PageLoader text="Loading classes..." />;
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="h-full flex flex-col sm:max-w-6xl sm:mx-auto">
        {/* Header - Fixed for mobile */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">Classes</h1>
                <p className="text-xs sm:text-sm text-gray-600">Create and manage your classes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Class</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md sm:max-w-lg mx-4">
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription className="text-sm">
                      Fill in the details to create a new class for your students.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateClass} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm">Class Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Math Grade 10A"
                          className="h-11"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="grade" className="text-sm">Grade/Level</Label>
                        <Input
                          id="grade"
                          value={formData.grade}
                          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                          placeholder="e.g., Grade 10"
                          className="h-11"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-sm">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the class"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="schoolName" className="text-sm">School Name</Label>
                        <Input
                          id="schoolName"
                          value={formData.schoolName}
                          onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                          placeholder="School name"
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="teacherName" className="text-sm">Teacher Name</Label>
                        <Input
                          id="teacherName"
                          value={formData.teacherName}
                          onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                          placeholder="Teacher name"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject" className="text-sm">Subject</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g., Mathematics, Science"
                        className="h-11"
                      />
                    </div>

                    {error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700 text-sm">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="flex-1 h-11"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isCreating}
                        className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isCreating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Create Class'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <GraduationCap className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm">
                Create your first class to start organizing your students and quizzes.
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Class
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <Card key={classItem._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{classItem.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {classItem.grade && `${classItem.grade} • `}
                          {classItem.subject}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/classes/${classItem._id}`)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClass(classItem._id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {classItem.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {classItem.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">
                          {classItem.students.length} students
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">
                          {classItem.quizzes.length} quizzes
                        </span>
                      </div>
                    </div>

                    {(classItem.schoolName || classItem.teacherName) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        {classItem.schoolName && <div>{classItem.schoolName}</div>}
                        {classItem.teacherName && <div>Teacher: {classItem.teacherName}</div>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
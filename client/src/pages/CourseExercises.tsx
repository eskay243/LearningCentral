import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, Trash, BookOpen, Code, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExerciseEditor from '@/components/content/ExerciseEditor';
import { UserRole } from '@shared/schema';

type Exercise = {
  id: number;
  title: string;
  description: string;
  moduleId?: number;
  lessonId?: number;
  language: string;
  difficulty: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  completions?: number;
  attempts?: number;
};

type Module = {
  id: number;
  title: string;
  description: string;
  courseId: number;
  orderIndex: number;
};

type Lesson = {
  id: number;
  title: string;
  description: string;
  moduleId: number;
  orderIndex: number;
  contentType: string;
};

const CourseExercises = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('modules');

  // Fetch course data
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch modules
  const { data: modules, isLoading: isLoadingModules } = useQuery({
    queryKey: [`/api/modules?courseId=${courseId}`],
    enabled: !!courseId,
  });

  // Fetch lessons based on selected module
  const { data: lessons, isLoading: isLoadingLessons } = useQuery({
    queryKey: [`/api/lessons?moduleId=${selectedModule}`],
    enabled: !!selectedModule,
  });

  // Fetch exercises
  const { data: exercises, isLoading: isLoadingExercises } = useQuery({
    queryKey: [
      '/api/coding-exercises',
      { moduleId: selectedModule, lessonId: selectedLesson }
    ],
    enabled: !!(selectedModule || selectedLesson),
  });

  // Check if user is authorized (admin or mentor of this course)
  const isAuthorized = React.useMemo(() => {
    if (!user) return false;
    return (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.MENTOR && course?.mentorId === user.id)
    );
  }, [user, course]);

  const handleModuleSelect = (moduleId: number) => {
    setSelectedModule(moduleId);
    setSelectedLesson(null);
    setActiveTab('lessons');
  };

  const handleLessonSelect = (lessonId: number) => {
    setSelectedLesson(lessonId);
    setActiveTab('exercises');
  };

  const handleCreateExercise = () => {
    setIsCreating(true);
  };

  const handleEditExercise = (exerciseId: number) => {
    setIsEditing(exerciseId);
  };

  const handleDeleteExercise = (exerciseId: number) => {
    setExerciseToDelete(exerciseId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteExercise = async () => {
    if (!exerciseToDelete) return;

    try {
      const response = await apiRequest('DELETE', `/api/coding-exercises/${exerciseToDelete}`);
      
      if (response.ok) {
        // Invalidate cache to reload exercises
        queryClient.invalidateQueries({ queryKey: ['/api/coding-exercises'] });
        toast({
          title: "Exercise deleted",
          description: "Exercise has been successfully deleted",
        });
      } else {
        throw new Error('Failed to delete exercise');
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setExerciseToDelete(null);
    }
  };

  const handleSaveExercise = async (exerciseData: any) => {
    try {
      const method = exerciseData.id ? 'PUT' : 'POST';
      const endpoint = exerciseData.id 
        ? `/api/coding-exercises/${exerciseData.id}` 
        : '/api/coding-exercises';
      
      const response = await apiRequest(method, endpoint, exerciseData);
      
      if (response.ok) {
        // Invalidate cache to reload exercises
        queryClient.invalidateQueries({ queryKey: ['/api/coding-exercises'] });
        toast({
          title: exerciseData.id ? "Exercise updated" : "Exercise created",
          description: exerciseData.id 
            ? "Exercise has been successfully updated" 
            : "Exercise has been successfully created",
        });
        setIsCreating(false);
        setIsEditing(null);
      } else {
        throw new Error(exerciseData.id ? 'Failed to update exercise' : 'Failed to create exercise');
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast({
        title: "Error",
        description: exerciseData.id 
          ? "Failed to update exercise. Please try again." 
          : "Failed to create exercise. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewExercise = (exerciseId: number) => {
    navigate(`/interactive-learning?exercise=${exerciseId}`);
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setIsEditing(null);
  };

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <p>The requested course could not be found.</p>
        <Button className="mt-4" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  if (isCreating || isEditing !== null) {
    const editingExercise = isEditing !== null && exercises 
      ? exercises.find(ex => ex.id === isEditing) 
      : undefined;

    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" className="mb-4" onClick={handleCancelEdit}>
          ← Back to Exercises
        </Button>
        
        <ExerciseEditor 
          moduleId={selectedModule || undefined}
          lessonId={selectedLesson || undefined}
          initialExercise={editingExercise}
          onSave={handleSaveExercise}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  const renderDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Advanced</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">Interactive Coding Exercises</p>
        </div>
        <Button 
          onClick={() => navigate(`/courses/${courseId}`)}
          variant="outline"
        >
          Back to Course
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="modules" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>Modules</span>
          </TabsTrigger>
          {selectedModule && (
            <TabsTrigger value="lessons" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>Lessons</span>
            </TabsTrigger>
          )}
          {selectedLesson && (
            <TabsTrigger value="exercises" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              <span>Exercises</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Course Modules</h2>
          </div>
          
          {isLoadingModules ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((module: Module) => (
                <Card key={module.id} className="cursor-pointer hover:border-primary transition-colors duration-200" onClick={() => handleModuleSelect(module.id)}>
                  <CardHeader className="pb-2">
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button variant="outline" className="w-full" onClick={() => handleModuleSelect(module.id)}>
                      Select Module
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="mb-4 text-muted-foreground">No modules found for this course.</p>
                <Button onClick={() => navigate(`/courses/${courseId}`)}>
                  Go to Course Details
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {modules?.find((m: Module) => m.id === selectedModule)?.title} - Lessons
            </h2>
            <Button variant="outline" onClick={() => { setSelectedModule(null); setActiveTab('modules'); }}>
              Back to Modules
            </Button>
          </div>
          
          {isLoadingLessons ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : lessons && lessons.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson: Lesson) => (
                <Card key={lesson.id} className="cursor-pointer hover:border-primary transition-colors duration-200" onClick={() => handleLessonSelect(lesson.id)}>
                  <CardHeader className="pb-2">
                    <CardTitle>{lesson.title}</CardTitle>
                    <CardDescription>{lesson.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Badge variant="outline">{lesson.contentType}</Badge>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" className="w-full" onClick={() => handleLessonSelect(lesson.id)}>
                      Select Lesson
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="mb-4 text-muted-foreground">No lessons found for this module.</p>
                <Button onClick={() => { setActiveTab('modules'); }}>
                  Go Back to Modules
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="exercises" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {lessons?.find((l: Lesson) => l.id === selectedLesson)?.title} - Exercises
            </h2>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => { setSelectedLesson(null); setActiveTab('lessons'); }}>
                Back to Lessons
              </Button>
              {isAuthorized && (
                <Button onClick={handleCreateExercise}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exercise
                </Button>
              )}
            </div>
          </div>
          
          {isLoadingExercises ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : exercises && exercises.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exercises.map((exercise: Exercise) => (
                <Card key={exercise.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-start justify-between">
                      <span>{exercise.title}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                              <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreviewExercise(exercise.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          {isAuthorized && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditExercise(exercise.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteExercise(exercise.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardTitle>
                    <CardDescription>{exercise.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-2">
                      {renderDifficultyBadge(exercise.difficulty)}
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                        {exercise.language}
                      </Badge>
                      {exercise.completions && (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {exercise.completions} completions
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button onClick={() => handlePreviewExercise(exercise.id)} className="w-full">
                      Open Exercise
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="mb-4 text-muted-foreground">No exercises found for this lesson.</p>
                {isAuthorized && (
                  <Button onClick={handleCreateExercise}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Exercise
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exercise</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exercise? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteExercise}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseExercises;
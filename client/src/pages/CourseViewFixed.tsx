import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlayCircle, 
  CheckCircle, 
  Lock, 
  BookOpen, 
  Clock,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageErrorBoundary, ComponentErrorBoundary } from "@/components/EnhancedErrorBoundary";
import { PageLoadingSpinner, LoadingSpinner } from "@/components/LoadingSpinner";
import CourseDiscussionSimple from "@/components/CourseDiscussionSimple";

export default function CourseView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  // Fetch course data with enhanced error handling
  const { 
    data: course, 
    isLoading: courseLoading, 
    isError: courseError,
    error: courseErrorDetails,
    refetch: refetchCourse
  } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
    retry: 2,
    staleTime: 60000,
  });

  // Check enrollment by getting student's enrolled courses
  const { 
    data: enrolledCourses,
    isLoading: enrollmentLoading,
    isError: enrollmentError,
    error: enrollmentErrorDetails
  } = useQuery({
    queryKey: ['/api/student/enrolled-courses'],
    enabled: !!isAuthenticated,
    retry: 2,
    staleTime: 30000,
  });

  // Check if current course is in enrolled courses
  const enrollment = Array.isArray(enrolledCourses) ? 
    enrolledCourses.find((course: any) => course.id === parseInt(id || '0')) : 
    undefined;
  
  // Check if user is the course owner
  const isOwner = course && user && course.mentorId === user.id;

  // Fetch modules with error handling
  const { 
    data: modules,
    isLoading: modulesLoading,
    isError: modulesError,
    error: modulesErrorDetails
  } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
    enabled: !!id,
    retry: 2,
    staleTime: 60000,
  });

  // Fetch lessons for current module with error handling
  const { 
    data: lessons,
    isLoading: lessonsLoading,
    isError: lessonsError,
    error: lessonsErrorDetails
  } = useQuery({
    queryKey: [`/api/modules/${currentModuleId}/lessons`],
    enabled: !!currentModuleId,
    retry: 2,
    staleTime: 60000,
  });

  // Set the first module as current when modules are loaded
  useEffect(() => {
    if (Array.isArray(modules) && modules.length > 0 && !currentModuleId) {
      setCurrentModuleId(modules[0].id);
    }
  }, [modules, currentModuleId]);

  // Set the first lesson as current when lessons are loaded
  useEffect(() => {
    if (Array.isArray(lessons) && lessons.length > 0 && !currentLessonId) {
      setCurrentLessonId(lessons[0].id);
    }
  }, [lessons, currentLessonId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  // Check if enrolled or owner
  useEffect(() => {
    if (enrolledCourses && !enrollment && !isOwner && !courseLoading && course) {
      toast({
        title: "Access Denied",
        description: "You need to enroll in this course to access the content.",
        variant: "destructive",
      });
      setLocation(`/courses/${id}`);
    }
  }, [enrollment, isOwner, enrolledCourses, courseLoading, course, id, setLocation, toast]);

  const currentLesson = Array.isArray(lessons) ? 
    lessons.find((lesson: any) => lesson.id === currentLessonId) : 
    undefined;
  const currentModule = Array.isArray(modules) ? 
    modules.find((module: any) => module.id === currentModuleId) : 
    undefined;

  // Build complete lessons list for navigation
  const allLessons = Array.isArray(modules) ? 
    modules.flatMap((module: any) => 
      Array.isArray(module.lessons) ? 
        module.lessons.map((lesson: any) => ({ ...lesson, moduleTitle: module.title })) : 
        []
    ).sort((a: any, b: any) => a.id - b.id) : 
    [];

  // Get current lesson index for navigation
  const currentLessonIndex = allLessons.findIndex((lesson: any) => lesson.id === currentLessonId);
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const handleLessonNavigation = (lessonId: number) => {
    const lesson = allLessons.find((l: any) => l.id === lessonId);
    if (lesson && Array.isArray(modules)) {
      const module = modules.find((m: any) => 
        Array.isArray(m.lessons) && m.lessons.some((l: any) => l.id === lessonId)
      );
      setCurrentLessonId(lessonId);
      setCurrentModuleId(module?.id || null);
    }
  };

  // Loading states with enhanced error handling
  if (courseLoading || enrollmentLoading) {
    return <PageLoadingSpinner text="Loading course content..." />;
  }

  // Error states with retry functionality
  if (courseError) {
    return (
      <PageErrorBoundary title="Course Loading Error">
        <div className="container mx-auto p-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load course</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {courseErrorDetails instanceof Error ? courseErrorDetails.message : 'Unable to fetch course details'}
              </p>
              <Button 
                onClick={() => refetchCourse()} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageErrorBoundary>
    );
  }

  if (enrollmentError) {
    return (
      <PageErrorBoundary title="Enrollment Check Error">
        <div className="container mx-auto p-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to verify enrollment</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {enrollmentErrorDetails instanceof Error ? enrollmentErrorDetails.message : 'Unable to check course enrollment status'}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageErrorBoundary>
    );
  }

  if (!course || (!enrollment && !isOwner)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Required</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to enroll in this course to access the content.
            </p>
            <Button onClick={() => setLocation(`/courses/${id}`)}>
              View Course Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = enrollment?.progress || 0;

  return (
    <PageErrorBoundary title="Course View">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/dashboard")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {course?.title || 'Course'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Progress: {Math.round(progressPercentage)}%
                </div>
                <Progress value={progressPercentage} className="w-32" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Course Content */}
            <div className="lg:col-span-1">
              <ComponentErrorBoundary title="Course Navigation">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course Content</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {modulesLoading ? (
                      <div className="p-6">
                        <LoadingSpinner text="Loading modules..." />
                      </div>
                    ) : modulesError ? (
                      <div className="p-6">
                        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Failed to load modules</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Array.isArray(modules) && modules.map((module: any, moduleIndex: number) => (
                          <div key={module.id}>
                            <div
                              className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                                currentModuleId === module.id 
                                  ? 'border-purple-600 bg-purple-50' 
                                  : 'border-transparent'
                              }`}
                              onClick={() => setCurrentModuleId(module.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-sm">{module.title}</h4>
                                  <p className="text-xs text-gray-500">Module {moduleIndex + 1}</p>
                                </div>
                                <BookOpen className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                            
                            {/* Show lessons for current module */}
                            {currentModuleId === module.id && (
                              <div className="ml-4 border-l border-gray-200">
                                {lessonsLoading ? (
                                  <div className="p-2">
                                    <LoadingSpinner size="sm" text="Loading lessons..." />
                                  </div>
                                ) : lessonsError ? (
                                  <div className="p-2 text-red-600 text-xs">
                                    <AlertCircle className="h-3 w-3 inline mr-1" />
                                    Failed to load lessons
                                  </div>
                                ) : (
                                  Array.isArray(lessons) && lessons.map((lesson: any, lessonIndex: number) => (
                                    <div
                                      key={lesson.id}
                                      className={`p-2 cursor-pointer hover:bg-gray-50 ${
                                        currentLessonId === lesson.id 
                                          ? 'bg-purple-50 text-purple-900' 
                                          : ''
                                      }`}
                                      onClick={() => setCurrentLessonId(lesson.id)}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <PlayCircle className="h-3 w-3" />
                                        <span className="text-xs">{lesson.title}</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ComponentErrorBoundary>
            </div>

            {/* Main Content Area with Tabs */}
            <div className="lg:col-span-3">
              <ComponentErrorBoundary title="Course Content Error">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content" className="flex items-center">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Course Content
                    </TabsTrigger>
                    <TabsTrigger value="discussions" className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Discussions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="mt-6">
                    {currentLesson ? (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{currentLesson.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {currentModule?.title}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {currentLesson.duration || '10'} min
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Video Player */}
                          {currentLesson.videoUrl && (
                            <div className="mb-6">
                              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                                <video
                                  controls
                                  className="w-full h-full rounded-lg"
                                  src={currentLesson.videoUrl}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            </div>
                          )}

                          {/* Lesson Content */}
                          <div className="space-y-4">
                            {currentLesson.content ? (
                              <div className="prose max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                              </div>
                            ) : (
                              <div className="text-center py-12 text-gray-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Lesson content will be available soon.</p>
                              </div>
                            )}
                          </div>

                          {/* Navigation */}
                          <div className="flex justify-between items-center mt-8 pt-6 border-t">
                            <Button 
                              variant="outline"
                              onClick={() => {
                                if (previousLesson) {
                                  handleLessonNavigation(previousLesson.id);
                                }
                              }}
                              disabled={!previousLesson}
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Previous Lesson
                            </Button>
                            <Button
                              onClick={() => {
                                if (nextLesson) {
                                  handleLessonNavigation(nextLesson.id);
                                } else {
                                  toast({
                                    title: "Course Completed!",
                                    description: "Congratulations on completing this course!",
                                  });
                                  setLocation(`/courses/${id}`);
                                }
                              }}
                              disabled={allLessons.length === 0}
                            >
                              {nextLesson ? (
                                <>
                                  Next Lesson
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                              ) : (
                                <>
                                  Finish Course
                                  <CheckCircle className="h-4 w-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="text-center py-12">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Welcome to {course?.title}
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Select a module from the sidebar to start learning.
                          </p>
                          {Array.isArray(modules) && modules.length === 0 && (
                            <div className="text-center text-gray-500">
                              <p>Course content is being prepared. Check back soon!</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="discussions" className="mt-6">
                    <ComponentErrorBoundary title="Discussions Error">
                      <CourseDiscussionSimple courseId={parseInt(id || '0')} />
                    </ComponentErrorBoundary>
                  </TabsContent>
                </Tabs>
              </ComponentErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
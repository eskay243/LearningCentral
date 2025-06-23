import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  PlayCircle, 
  CheckCircle, 
  Lock, 
  BookOpen, 
  Clock,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CourseView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
  });

  // Check enrollment by getting student's enrolled courses
  const { data: enrolledCourses } = useQuery({
    queryKey: ['/api/student/enrolled-courses'],
    enabled: !!isAuthenticated,
  });

  // Check if current course is in enrolled courses
  const enrollment = enrolledCourses?.find((course: any) => course.id === parseInt(id || '0'));
  
  // Check if user is the course owner
  const isOwner = course && user && course.mentorId === user.id;

  // Fetch modules
  const { data: modules } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
    enabled: !!id,
  });

  // Fetch lessons for current module
  const { data: lessons } = useQuery({
    queryKey: [`/api/modules/${currentModuleId}/lessons`],
    enabled: !!currentModuleId,
  });

  // Set the first module as current when modules are loaded
  useEffect(() => {
    if (modules && modules.length > 0 && !currentModuleId) {
      setCurrentModuleId(modules[0].id);
    }
  }, [modules, currentModuleId]);

  // Set the first lesson as current when lessons are loaded
  useEffect(() => {
    if (lessons && lessons.length > 0 && !currentLessonId) {
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

  const currentLesson = lessons?.find(lesson => lesson.id === currentLessonId);
  const currentModule = modules?.find(module => module.id === currentModuleId);

  // Build complete lessons list for navigation
  const allLessons = modules?.flatMap(module => 
    module.lessons?.map(lesson => ({ ...lesson, moduleTitle: module.title })) || []
  ).sort((a, b) => a.id - b.id) || [];

  // Get current lesson index for navigation
  const currentLessonIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const handleLessonNavigation = (lessonId: number) => {
    const lesson = allLessons.find(l => l.id === lessonId);
    if (lesson) {
      const module = modules?.find(m => m.lessons?.some(l => l.id === lessonId));
      setCurrentLessonId(lessonId);
      setCurrentModuleId(module?.id || null);
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!course || (!enrollment && !isOwner)) {
    return null;
  }

  const progressPercentage = enrollment?.progress || 0;

  return (
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
              <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {modules?.map((module: any, moduleIndex: number) => (
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
                      {currentModuleId === module.id && lessons && (
                        <div className="ml-4 border-l border-gray-200">
                          {lessons.map((lesson: any, lessonIndex: number) => (
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
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
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
                  <div className="prose max-w-none">
                    {currentLesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
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
                        console.log('Previous lesson clicked:', {
                          previousLesson: previousLesson ? { id: previousLesson.id, title: previousLesson.title } : null,
                          currentLessonIndex,
                          allLessonsLength: allLessons.length
                        });
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
                        console.log('Next/Finish lesson clicked:', {
                          nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
                          currentLessonIndex,
                          allLessonsLength: allLessons.length,
                          isLastLesson: !nextLesson
                        });
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
                    Welcome to {course.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select a module from the sidebar to start learning.
                  </p>
                  {modules && modules.length === 0 && (
                    <div className="text-center text-gray-500">
                      <p>Course content is being prepared. Check back soon!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
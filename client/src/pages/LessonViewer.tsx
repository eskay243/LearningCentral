import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, BookOpen, Clock, CheckCircle, PlayCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LessonViewer() {
  const { courseId, lessonId } = useParams();
  const [, setLocation] = useLocation();
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [hasStartedVideo, setHasStartedVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lesson data
  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/lessons/${lessonId}`],
  });

  // Fetch course data for context
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  // Fetch modules to get lessons for navigation
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/modules`],
  });

  // Progress tracking mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (progressData: { 
      completionPercentage: number; 
      status: string; 
      timeSpent?: number; 
      completedAt?: Date;
    }) => {
      return apiRequest("POST", `/api/lessons/${lessonId}/progress`, progressData);
    },
    onSuccess: () => {
      // Invalidate course progress to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: [`/api/student/enrolled-courses`] });
    },
  });

  // Extract all lessons from modules for navigation
  const lessons = modules.flatMap((module: any) => module.lessons || []).sort((a: any, b: any) => {
    // If orderIndex is the same, sort by ID to ensure consistent order
    if (a.orderIndex === b.orderIndex) {
      return a.id - b.id;
    }
    return a.orderIndex - b.orderIndex;
  });

  // Video event handlers for progress tracking
  const handleVideoPlay = () => {
    if (!hasStartedVideo) {
      setHasStartedVideo(true);
      // Mark lesson as started
      updateProgressMutation.mutate({
        completionPercentage: 0,
        status: "in_progress",
        timeSpent: 0
      });
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      setVideoProgress(progress);
      
      // Update progress every 25% completion
      if (progress >= 25 && !hasStartedVideo) {
        updateProgressMutation.mutate({
          completionPercentage: Math.floor(progress),
          status: "in_progress",
          timeSpent: Math.floor(video.currentTime)
        });
      }
    }
  };

  const handleVideoEnded = () => {
    setIsCompleted(true);
    setVideoProgress(100);
    // Mark lesson as completed
    updateProgressMutation.mutate({
      completionPercentage: 100,
      status: "completed",
      timeSpent: lesson?.duration || 0,
      completedAt: new Date()
    });
    
    toast({
      title: "Lesson Completed!",
      description: "Great job! Your progress has been saved.",
    });
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    updateProgressMutation.mutate({
      completionPercentage: 100,
      status: "completed",
      timeSpent: lesson?.duration || 0,
      completedAt: new Date()
    });
    
    toast({
      title: "Lesson Marked Complete!",
      description: "Your progress has been saved.",
    });
  };

  if (lessonLoading || courseLoading || modulesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!lesson || !course || !modules) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load lesson content.</p>
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              className="p-0 h-auto hover:bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Lesson Not Found</h2>
            <p className="text-gray-600 mb-4">The lesson you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => setLocation(`/courses/${courseId}`)}>
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fix lesson navigation logic
  const currentLessonId = parseInt(lessonId || '0');
  let currentLessonIndex = -1;
  let allLessons: any[] = [];
  
  // Build complete lesson list from modules
  if (modules && modules.length > 0) {
    allLessons = modules.flatMap((module: any) => {
      if (module.lessons && Array.isArray(module.lessons)) {
        return module.lessons.map((lesson: any) => ({
          ...lesson,
          moduleTitle: module.title
        }));
      }
      return [];
    }).sort((a: any, b: any) => {
      // Sort by ID if orderIndex is the same
      if (a.orderIndex === b.orderIndex) {
        return a.id - b.id;
      }
      return a.orderIndex - b.orderIndex;
    });
    
    currentLessonIndex = allLessons.findIndex((l: any) => l.id === currentLessonId);
  }
  
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;
  const progress = allLessons.length > 0 ? ((currentLessonIndex + 1) / allLessons.length) * 100 : 0;

  // Debug logging for navigation
  console.log('Navigation Debug:', {
    currentLessonId,
    lessonIdParam: lessonId,
    modulesCount: modules?.length || 0,
    allLessons: allLessons.map(l => ({ id: l.id, title: l.title })),
    allLessonsLength: allLessons.length,
    currentLessonIndex,
    previousLesson: previousLesson ? { id: previousLesson.id, title: previousLesson.title } : null,
    nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null
  });

  const handleNavigation = (targetLessonId: number) => {
    setLocation(`/courses/${courseId}/lessons/${targetLessonId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/courses/${courseId}`)}
            className="p-0 h-auto hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {course?.title}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{lesson.duration || 15} min</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>Lesson {currentLessonIndex + 1} of {allLessons.length}</span>
              </div>
              {lesson.lessonType && (
                <Badge variant="secondary">{lesson.lessonType}</Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Course Progress</div>
            <Progress value={progress} className="w-32" />
            <div className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Lesson Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Lesson Content
                </CardTitle>
                {isCompleted ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Button onClick={handleMarkComplete} size="sm">
                    Mark as Complete
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="prose prose-sm max-w-none">
                  {lesson.content ? (
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Lesson content will be available here.</p>
                      <p className="text-sm">This lesson is part of: {course?.title}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Video/Interactive Content */}
          {lesson.videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Video Lesson</CardTitle>
                <div className="text-sm text-gray-600">
                  Progress: {Math.round(videoProgress)}% complete
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full"
                    onPlay={handleVideoPlay}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                    poster={lesson.videoPoster}
                  />
                </div>
                <div className="mt-4">
                  <Progress value={videoProgress} className="w-full" />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Video Progress</span>
                    <span>{Math.round(videoProgress)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (previousLesson) {
                  handleNavigation(previousLesson.id);
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
                  handleNavigation(nextLesson.id);
                }
              }}
              disabled={!nextLesson}
            >
              Next Lesson
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lesson Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {lessons?.map((l: any, index: number) => (
                    <div
                      key={l.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        l.id === parseInt(lessonId || '0')
                          ? 'bg-purple-50 border-purple-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleNavigation(l.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{l.title}</div>
                          <div className="text-xs text-gray-500">
                            Lesson {index + 1}
                          </div>
                        </div>
                        {l.id === parseInt(lessonId || '0') && (
                          <PlayCircle className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Course</div>
                  <div className="text-sm text-gray-600">{course?.title}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm font-medium">Total Lessons</div>
                  <div className="text-sm text-gray-600">{lessons?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Current Progress</div>
                  <div className="text-sm text-gray-600">{Math.round(progress)}% complete</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
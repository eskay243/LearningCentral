import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight, List, Check, Lock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  contentType: string;
  duration?: number;
  isPreview: boolean;
  requiresAuth: boolean;
  orderIndex: number;
}

interface Module {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface LessonProgress {
  lessonId: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
}

interface LessonNavigationProps {
  modules: Module[];
  currentLessonId: number;
  courseId: number;
  progressData?: LessonProgress[];
  view?: 'horizontal' | 'vertical';
}

const LessonNavigation: React.FC<LessonNavigationProps> = ({
  modules,
  currentLessonId,
  courseId,
  progressData = [],
  view = 'vertical'
}) => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({});
  
  // Sort modules and lessons by order index
  const sortedModules = [...modules].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Find current lesson and module
  const currentModuleAndLesson = sortedModules.reduce<{
    module: Module | null;
    lesson: Lesson | null;
    index: number;
    moduleIndex: number;
  }>(
    (acc, module, moduleIdx) => {
      const lessonIndex = module.lessons.findIndex(lesson => lesson.id === currentLessonId);
      if (lessonIndex !== -1) {
        return {
          module,
          lesson: module.lessons[lessonIndex],
          index: lessonIndex,
          moduleIndex: moduleIdx
        };
      }
      return acc;
    },
    { module: null, lesson: null, index: -1, moduleIndex: -1 }
  );
  
  // Auto-expand current module
  React.useEffect(() => {
    if (currentModuleAndLesson.module) {
      setOpenModules(prev => ({
        ...prev,
        [currentModuleAndLesson.module!.id]: true
      }));
    }
  }, [currentModuleAndLesson.module]);
  
  // Toggle module expansion
  const toggleModule = (moduleId: number) => {
    setOpenModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  // Find progress for a lesson
  const getLessonProgress = (lessonId: number): LessonProgress | undefined => {
    return progressData.find(p => p.lessonId === lessonId);
  };
  
  // Navigate to next or previous lesson
  const navigateToLesson = (direction: 'prev' | 'next') => {
    const { module, index, moduleIndex } = currentModuleAndLesson;
    
    if (!module) return;
    
    const currentModuleLessons = module.lessons.sort((a, b) => a.orderIndex - b.orderIndex);
    
    if (direction === 'next') {
      // Check if there's a next lesson in the current module
      if (index < currentModuleLessons.length - 1) {
        const nextLesson = currentModuleLessons[index + 1];
        navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
        return;
      }
      
      // Check if there's a next module with lessons
      if (moduleIndex < sortedModules.length - 1) {
        const nextModule = sortedModules[moduleIndex + 1];
        const nextModuleLessons = nextModule.lessons.sort((a, b) => a.orderIndex - b.orderIndex);
        if (nextModuleLessons.length > 0) {
          const firstLesson = nextModuleLessons[0];
          navigate(`/courses/${courseId}/lessons/${firstLesson.id}`);
          return;
        }
      }
    } else if (direction === 'prev') {
      // Check if there's a previous lesson in the current module
      if (index > 0) {
        const prevLesson = currentModuleLessons[index - 1];
        navigate(`/courses/${courseId}/lessons/${prevLesson.id}`);
        return;
      }
      
      // Check if there's a previous module with lessons
      if (moduleIndex > 0) {
        const prevModule = sortedModules[moduleIndex - 1];
        const prevModuleLessons = prevModule.lessons.sort((a, b) => a.orderIndex - b.orderIndex);
        if (prevModuleLessons.length > 0) {
          const lastLesson = prevModuleLessons[prevModuleLessons.length - 1];
          navigate(`/courses/${courseId}/lessons/${lastLesson.id}`);
          return;
        }
      }
    }
  };
  
  // Calculate overall course progress
  const calculateCourseProgress = (): number => {
    const totalLessons = sortedModules.reduce((total, module) => total + module.lessons.length, 0);
    const completedLessons = progressData.filter(p => p.status === 'completed').length;
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };
  
  // Format duration for display
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };
  
  // Get icon for lesson type
  const getLessonTypeIcon = (lesson: Lesson) => {
    if (lesson.contentType === 'video') {
      return <PlayCircle className="w-4 h-4 mr-2" />;
    }
    return null;
  };
  
  // Render lesson status icon
  const getLessonStatusIcon = (lesson: Lesson) => {
    const progress = getLessonProgress(lesson.id);
    
    if (progress?.status === 'completed') {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    
    if (lesson.requiresAuth && !isAuthenticated && !lesson.isPreview) {
      return <Lock className="w-4 h-4 text-gray-400" />;
    }
    
    return null;
  };
  
  // For horizontal view (next/prev navigation)
  if (view === 'horizontal') {
    const { lesson, module } = currentModuleAndLesson;
    
    return (
      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => navigateToLesson('prev')}
          disabled={!module || (currentModuleAndLesson.moduleIndex === 0 && currentModuleAndLesson.index === 0)}
          className="flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Lesson
        </Button>
        
        <Button
          variant="default"
          onClick={() => navigateToLesson('next')}
          disabled={
            !module || 
            (currentModuleAndLesson.moduleIndex === sortedModules.length - 1 && 
             currentModuleAndLesson.index === module.lessons.length - 1)
          }
          className="flex items-center"
        >
          Next Lesson
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  // For vertical view (course outline)
  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Course Progress</h3>
        <Progress value={calculateCourseProgress()} className="h-2" />
        <p className="text-sm mt-1 text-muted-foreground">{calculateCourseProgress()}% completed</p>
      </div>
      
      <div className="space-y-2">
        {sortedModules.map((module) => {
          const sortedLessons = [...module.lessons].sort(
            (a, b) => a.orderIndex - b.orderIndex
          );
          
          return (
            <Collapsible
              key={module.id}
              open={openModules[module.id]}
              onOpenChange={() => toggleModule(module.id)}
              className="border rounded-md overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 text-left font-medium h-auto"
                >
                  <span>{module.title}</span>
                  <List className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-1 py-2 divide-y divide-border">
                  {sortedLessons.map((lesson) => {
                    const progress = getLessonProgress(lesson.id);
                    const isActive = currentLessonId === lesson.id;
                    
                    return (
                      <div
                        key={lesson.id}
                        className={`
                          px-3 py-2 
                          ${isActive ? 'bg-muted' : ''} 
                          ${progress?.status === 'completed' ? 'border-l-2 border-green-500' : ''}
                          ${lesson.requiresAuth && !isAuthenticated && !lesson.isPreview 
                            ? 'opacity-70' 
                            : 'hover:bg-muted/50 cursor-pointer'}
                          transition-colors
                        `}
                        onClick={() => {
                          if (lesson.requiresAuth && !isAuthenticated && !lesson.isPreview) {
                            return;
                          }
                          navigate(`/courses/${courseId}/lessons/${lesson.id}`);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            {getLessonTypeIcon(lesson)}
                            <span className={`truncate flex-1 ${isActive ? 'font-medium' : ''}`}>
                              {lesson.title}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {lesson.isPreview && (
                              <Badge variant="outline" className="text-xs">Preview</Badge>
                            )}
                            
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(lesson.duration)}
                              </span>
                            )}
                            
                            {getLessonStatusIcon(lesson)}
                          </div>
                        </div>
                        
                        {progress && progress.status === 'in_progress' && (
                          <Progress 
                            value={progress.progress} 
                            className="h-1 mt-1" 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </Card>
  );
};

export default LessonNavigation;
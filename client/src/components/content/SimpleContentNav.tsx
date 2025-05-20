import React from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  File,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
  isCompleted?: boolean;
}

interface Lesson {
  id: number;
  title: string;
  moduleId: number;
  isCompleted?: boolean;
  contentType: string;
  isActive?: boolean;
}

interface SimpleContentNavProps {
  modules: Module[];
  currentLessonId?: number;
  onLessonSelect: (lessonId: number) => void;
  showControls?: boolean;
}

const SimpleContentNav: React.FC<SimpleContentNavProps> = ({
  modules,
  currentLessonId,
  onLessonSelect,
  showControls = true
}) => {
  const { toast } = useToast();
  
  // Find the current module based on the current lesson
  const currentModule = modules.find(module => 
    module.lessons.some(lesson => lesson.id === currentLessonId)
  );

  // Find the current lesson
  const currentLesson = currentModule?.lessons.find(lesson => 
    lesson.id === currentLessonId
  );

  // Get the next lesson
  const getNextLesson = (): Lesson | undefined => {
    if (!currentLessonId || !currentModule) return undefined;
    
    const currentIndex = currentModule.lessons.findIndex(lesson => lesson.id === currentLessonId);
    
    // If there's a next lesson in the current module
    if (currentIndex < currentModule.lessons.length - 1) {
      return currentModule.lessons[currentIndex + 1];
    }
    
    // If we need to go to the next module
    const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.lessons.length > 0) {
        return nextModule.lessons[0];
      }
    }
    
    return undefined;
  };

  // Get the previous lesson
  const getPreviousLesson = (): Lesson | undefined => {
    if (!currentLessonId || !currentModule) return undefined;
    
    const currentIndex = currentModule.lessons.findIndex(lesson => lesson.id === currentLessonId);
    
    // If there's a previous lesson in the current module
    if (currentIndex > 0) {
      return currentModule.lessons[currentIndex - 1];
    }
    
    // If we need to go to the previous module
    const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
    if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      if (prevModule.lessons.length > 0) {
        return prevModule.lessons[prevModule.lessons.length - 1];
      }
    }
    
    return undefined;
  };

  // Navigate to next lesson
  const handleNextClick = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      onLessonSelect(nextLesson.id);
    } else {
      toast({
        title: 'End of Course',
        description: 'You have reached the end of the course'
      });
    }
  };

  // Navigate to previous lesson
  const handlePrevClick = () => {
    const prevLesson = getPreviousLesson();
    if (prevLesson) {
      onLessonSelect(prevLesson.id);
    } else {
      toast({
        title: 'Start of Course',
        description: 'You are at the beginning of the course'
      });
    }
  };

  // Calculate the overall progress
  const calculateProgress = (): number => {
    let totalLessons = 0;
    let completedLessons = 0;
    
    modules.forEach(module => {
      totalLessons += module.lessons.length;
      completedLessons += module.lessons.filter(l => l.isCompleted).length;
    });
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-muted rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {calculateProgress()}% Complete
        </div>
      </div>
      
      {/* Module and lesson navigation */}
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          defaultValue={currentModule ? [currentModule.id.toString()] : []}
          className="w-full"
        >
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id.toString()}>
              <AccordionTrigger className="py-2 text-left">
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span className="text-sm">{module.title}</span>
                  {module.isCompleted && (
                    <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-6 space-y-1">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={cn(
                        "flex items-center rounded-md p-2 text-sm cursor-pointer",
                        lesson.id === currentLessonId
                          ? "bg-muted font-medium"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => onLessonSelect(lesson.id)}
                    >
                      <File className="mr-2 h-4 w-4" />
                      <span className="flex-1 truncate">{lesson.title}</span>
                      {lesson.isCompleted && (
                        <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
      {/* Next/Previous controls */}
      {showControls && (
        <div className="flex justify-between mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevClick}
            disabled={!getPreviousLesson()}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextClick}
            disabled={!getNextLesson()}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimpleContentNav;
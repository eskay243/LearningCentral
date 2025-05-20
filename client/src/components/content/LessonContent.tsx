import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from './VideoPlayer';
import TextContent from './TextContent';
import ResourceItem from './ResourceItem';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Lock, Play, FileText, Book, Download } from 'lucide-react';

interface Resource {
  id: number;
  lessonId: number;
  title: string;
  description?: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  isDownloadable: boolean;
  requiresAuth: boolean;
  isPreview: boolean;
  orderIndex: number;
}

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description?: string;
  content?: string;
  contentType: string;
  videoUrl?: string;
  videoPoster?: string;
  videoProvider?: string;
  duration?: number;
  isLive: boolean;
  scheduledAt?: string;
  isPreview: boolean;
  requiresAuth: boolean;
  drm?: string;
  published: boolean;
}

interface LessonProgress {
  id?: number;
  lessonId: number;
  userId: string;
  status: string;
  progress: number;
  lastAccessedAt?: string;
  completedAt?: string;
  timeSpent?: number;
  playbackPosition?: number;
}

interface LessonContentProps {
  lesson: Lesson;
  resources?: Resource[];
  initialProgress?: LessonProgress;
  onProgressUpdate?: (progress: LessonProgress) => void;
  onComplete?: () => void;
}

const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  resources = [],
  initialProgress,
  onProgressUpdate,
  onComplete,
}) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [progress, setProgress] = useState<LessonProgress | undefined>(initialProgress);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if lesson is accessible
  const isAccessible = !lesson.requiresAuth || isAuthenticated || lesson.isPreview;
  
  // Sort resources by order index
  const sortedResources = [...resources].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Get content type display
  const getContentTypeDisplay = () => {
    switch (lesson.contentType) {
      case 'video':
        return (
          <Badge variant="outline" className="ml-2">
            <Play className="h-3 w-3 mr-1" /> Video
          </Badge>
        );
      case 'text':
        return (
          <Badge variant="outline" className="ml-2">
            <FileText className="h-3 w-3 mr-1" /> Text
          </Badge>
        );
      case 'interactive':
        return (
          <Badge variant="outline" className="ml-2">
            <Book className="h-3 w-3 mr-1" /> Interactive
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Format duration for display
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Load lesson progress
  useEffect(() => {
    if (isAuthenticated && !lesson.isPreview && !initialProgress) {
      fetchLessonProgress();
    }
  }, [isAuthenticated, lesson.id]);
  
  // Fetch lesson progress from server
  const fetchLessonProgress = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest('GET', `/api/lessons/${lesson.id}/progress`);
      const data = await response.json();
      
      if (data) {
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update lesson progress
  const updateProgress = async (newProgress: Partial<LessonProgress>) => {
    if (!isAuthenticated || lesson.isPreview) return;
    
    try {
      const updatedProgress = {
        ...progress,
        ...newProgress,
        lessonId: lesson.id,
      };
      
      const response = await apiRequest('POST', `/api/lessons/${lesson.id}/progress`, updatedProgress);
      const data = await response.json();
      
      setProgress(data);
      
      if (onProgressUpdate) {
        onProgressUpdate(data);
      }
      
      // Check if lesson is completed
      if (data.status === 'completed' && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };
  
  // Handle progress update from video player
  const handleVideoProgress = (progressPercent: number) => {
    // Only update every 5% change to avoid excessive API calls
    if (progress && Math.abs(progressPercent - progress.progress) < 5) {
      return;
    }
    
    updateProgress({
      progress: progressPercent,
      status: progressPercent > 95 ? 'completed' : 'in_progress',
    });
  };
  
  // Handle video completion
  const handleVideoComplete = () => {
    updateProgress({
      progress: 100,
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  };
  
  // If not accessible
  if (!isAccessible) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Premium Content</h3>
          <p className="text-muted-foreground mb-6">
            This lesson is part of premium content. Please log in or enroll in this course to access it.
          </p>
          <Button asChild>
            <a href="/api/login">Log In</a>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="flex flex-wrap justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold flex items-center">
            {lesson.title}
            {getContentTypeDisplay()}
          </h2>
          
          {lesson.duration && (
            <div className="text-sm text-muted-foreground mt-1">
              Duration: {formatDuration(lesson.duration)}
            </div>
          )}
          
          {progress && (
            <div className="mt-2">
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {progress.status === 'completed' 
                  ? 'Completed' 
                  : progress.status === 'in_progress' 
                    ? `${Math.round(progress.progress)}% complete` 
                    : 'Not started'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Tabs */}
      <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">
            {lesson.contentType === 'video' ? 'Video' : 'Content'}
          </TabsTrigger>
          <TabsTrigger value="resources" disabled={sortedResources.length === 0}>
            Resources {sortedResources.length > 0 && `(${sortedResources.length})`}
          </TabsTrigger>
        </TabsList>
        
        {/* Content Tab */}
        <TabsContent value="content" className="mt-4">
          {lesson.contentType === 'video' && lesson.videoUrl && (
            <VideoPlayer
              lessonId={lesson.id}
              videoUrl={lesson.videoUrl}
              posterUrl={lesson.videoPoster}
              title={lesson.title}
              initialPosition={progress?.playbackPosition || 0}
              onProgress={handleVideoProgress}
              onComplete={handleVideoComplete}
              isPreview={lesson.isPreview}
            />
          )}
          
          {lesson.contentType === 'text' && lesson.content && (
            <TextContent
              lessonId={lesson.id}
              content={lesson.content}
              isPreview={lesson.isPreview}
              requiresAuth={lesson.requiresAuth}
              isDRM={!!lesson.drm}
            />
          )}
          
          {lesson.description && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <h3 className="text-lg font-medium mb-3">Lesson Description</h3>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.description }} />
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-4">
          {sortedResources.length > 0 ? (
            <div className="space-y-4">
              {sortedResources.map((resource) => (
                <ResourceItem
                  key={resource.id}
                  id={resource.id}
                  lessonId={lesson.id}
                  title={resource.title}
                  description={resource.description}
                  type={resource.type}
                  url={resource.url}
                  thumbnailUrl={resource.thumbnailUrl}
                  fileSize={resource.fileSize}
                  isDownloadable={resource.isDownloadable}
                  requiresAuth={resource.requiresAuth}
                  isPreview={resource.isPreview}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No resources available for this lesson.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LessonContent;
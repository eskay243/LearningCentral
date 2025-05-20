import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Eye, Copy, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TextContentProps {
  lessonId: number;
  content: string;
  isPreview?: boolean;
  requiresAuth?: boolean;
  isDRM?: boolean;
}

const TextContent: React.FC<TextContentProps> = ({
  lessonId,
  content,
  isPreview = false,
  requiresAuth = true,
  isDRM = false,
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [trackingIntervalId, setTrackingIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [readingTime, setReadingTime] = useState(0);
  
  // Approximate reading time in minutes (average reading speed: 200 words per minute)
  const estimatedReadingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  
  // Apply DRM protection by disabling right-click and selection
  useEffect(() => {
    if (isDRM && isAuthenticated && !isPreview) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        toast({
          title: 'Copy Protection',
          description: 'Right-click is disabled for protected content.',
          variant: 'default',
        });
      };
      
      const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 100) {
          selection.removeAllRanges();
          toast({
            title: 'Copy Protection',
            description: 'Selecting large amounts of text is disabled for protected content.',
            variant: 'default',
          });
        }
      };
      
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('selectstart', handleSelection);
      document.addEventListener('copy', handleSelection);
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('selectstart', handleSelection);
        document.removeEventListener('copy', handleSelection);
      };
    }
  }, [isDRM, isAuthenticated, isPreview, toast]);
  
  // Track reading progress
  useEffect(() => {
    if (isAuthenticated && !isPreview) {
      // Start a timer to track reading time
      const intervalId = setInterval(() => {
        setReadingTime(prev => prev + 1);
      }, 1000);
      
      setTrackingIntervalId(intervalId);
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
          // Save reading progress when unmounting
          saveReadingProgress();
        }
      };
    }
  }, [isAuthenticated, isPreview]);
  
  // Save reading progress periodically
  useEffect(() => {
    // Save progress every 30 seconds
    if (readingTime > 0 && readingTime % 30 === 0) {
      saveReadingProgress();
    }
    
    // Mark as completed if user has spent enough time reading
    if (readingTime > estimatedReadingTime * 60 * 0.7) { // 70% of estimated reading time
      saveReadingProgress(true);
    }
  }, [readingTime, estimatedReadingTime]);
  
  // Save reading progress to server
  const saveReadingProgress = async (completed = false) => {
    if (!isAuthenticated || isPreview) return;
    
    try {
      // Calculate progress percentage
      const progressPercent = Math.min(100, (readingTime / (estimatedReadingTime * 60)) * 100);
      
      await apiRequest('POST', `/api/lessons/${lessonId}/progress`, {
        progress: progressPercent,
        status: completed ? 'completed' : 'in_progress',
        timeSpent: readingTime,
      });
    } catch (error) {
      console.error('Failed to save reading progress:', error);
    }
  };
  
  // Handle copy content button
  const handleCopy = () => {
    if (isDRM && !isPreview) {
      toast({
        title: 'Copy Protection',
        description: 'This content is protected and cannot be copied.',
        variant: 'destructive',
      });
      return;
    }
    
    navigator.clipboard.writeText(content)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        
        toast({
          title: 'Content Copied',
          description: 'The content has been copied to your clipboard.',
          variant: 'default',
        });
      })
      .catch((error) => {
        console.error('Failed to copy content:', error);
        toast({
          title: 'Copy Failed',
          description: 'Failed to copy content to clipboard.',
          variant: 'destructive',
        });
      });
  };
  
  // Handle content reveal for preview mode
  const handleRevealContent = () => {
    if (requiresAuth && !isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to view this content.',
        variant: 'destructive'
      });
      return;
    }
    
    setShowFullContent(true);
  };
  
  // For preview mode with restricted content
  if (isPreview && !showFullContent) {
    // Show just a preview (first 500 characters)
    const previewContent = content.substring(0, 500);
    
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: previewContent + '...' }} />
            
            <div className="mt-6 p-4 bg-muted rounded-md text-center">
              <p className="mb-4">This is a preview of the lesson content.</p>
              <Button onClick={handleRevealContent}>
                <Eye className="mr-2 h-4 w-4" />
                View Full Content
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // For authenticated users or when content is revealed
  if (isAuthenticated || !requiresAuth || showFullContent) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Estimated reading time: {estimatedReadingTime} min
            </div>
            
            {!isDRM && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                disabled={isCopied}
              >
                {isCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className={`prose max-w-none ${isDRM ? 'select-none' : ''}`}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          
          {isDRM && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700 flex items-center">
              <Lock className="mr-2 h-4 w-4" />
              This content is protected by digital rights management. Copying and redistribution is prohibited.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // For unauthenticated users with required auth
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
        <p className="text-muted-foreground mb-4">
          Please log in to view this content.
        </p>
        <Button asChild>
          <a href="/api/login">Log In</a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TextContent;
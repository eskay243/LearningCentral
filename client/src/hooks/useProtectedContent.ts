import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';

/**
 * Hook for accessing DRM-protected content
 */
export function useProtectedContent(lessonId: number | null) {
  const { toast } = useToast();
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Fetch protected content
  const {
    data: protectedContent,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: lessonId ? [`/api/drm/lessons/${lessonId}/protected-content`] : null,
    enabled: !!lessonId,
    retry: false,
    onError: (err: any) => {
      if (err.status === 403) {
        setAccessDenied(true);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have access to this content. Please enroll in the course to continue.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load protected content. Please try again.",
        });
      }
    }
  });

  // Fetch secure video URL if this lesson has video content
  const {
    data: videoData,
    isLoading: isVideoLoading,
  } = useQuery({
    queryKey: lessonId ? [`/api/drm/lessons/${lessonId}/secure-video-url`] : null,
    enabled: !!lessonId,
    retry: false,
  });

  return {
    content: protectedContent?.content || '',
    drmType: protectedContent?.drm || 'none',
    videoUrl: videoData?.videoUrl || '',
    isLoading,
    isVideoLoading,
    error,
    accessDenied,
    refetch,
  };
}
import React from 'react';
import { useProtectedContent } from '@/hooks/useProtectedContent';
import { Button } from '@/components/ui/button';
import { Shield, LockKeyhole, Lock, UnlockKeyhole } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedContentProps {
  lessonId: number;
  isPreview?: boolean;
  onEnrollClick?: () => void;
}

export function ProtectedContent({ lessonId, isPreview, onEnrollClick }: ProtectedContentProps) {
  const {
    content,
    drmType,
    videoUrl,
    isLoading,
    isVideoLoading,
    accessDenied,
    refetch,
  } = useProtectedContent(lessonId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <div className="text-center mb-6">
          <Lock className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h3 className="text-2xl font-bold">Premium Content</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            This content is protected and requires enrollment to access
          </p>
        </div>

        {onEnrollClick ? (
          <Button 
            size="lg" 
            onClick={onEnrollClick}
            className="mt-4"
          >
            Enroll Now To Access
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm mt-2">
            Please enroll in this course to access this content
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {drmType !== 'none' && drmType && (
        <div className="flex items-center gap-2 absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-muted/90 z-10">
          <Shield className="h-3 w-3 text-primary" />
          <span>Protected</span>
        </div>
      )}

      {videoUrl && (
        <div className="mb-6 rounded-md overflow-hidden">
          {isVideoLoading ? (
            <Skeleton className="h-[360px] w-full" />
          ) : (
            <video
              controls
              className="w-full rounded-md"
              src={videoUrl}
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            >
              Your browser does not support video playback.
            </video>
          )}
        </div>
      )}

      {drmType !== 'none' && (
        <div className="mb-4">
          <Alert variant={drmType === 'premium' ? 'destructive' : 'default'}>
            <div className="flex items-start gap-2">
              {drmType === 'premium' ? (
                <LockKeyhole className="h-4 w-4 mt-0.5" />
              ) : (
                <UnlockKeyhole className="h-4 w-4 mt-0.5" />
              )}
              <div>
                <AlertTitle>
                  {drmType === 'premium' 
                    ? 'Premium Protected Content' 
                    : drmType === 'watermark' 
                      ? 'Licensed Content' 
                      : 'Protected Content'}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {drmType === 'premium' 
                    ? 'This premium content is protected by Digital Rights Management. Unauthorized copying, sharing, or distribution is prohibited and may be punishable by law.'
                    : drmType === 'watermark'
                      ? 'This content contains personalized watermarks. Sharing is not permitted.'
                      : 'This content is protected. Please do not share or distribute without permission.'}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      )}

      <div className="lesson-content prose max-w-none dark:prose-invert">
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p className="text-muted-foreground">No content available for this lesson.</p>
        )}
      </div>
    </div>
  );
}
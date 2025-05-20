import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  lessonId: number;
  videoUrl: string;
  posterUrl?: string;
  title: string;
  autoSave?: boolean;
  initialPosition?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  isPreview?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lessonId,
  videoUrl,
  posterUrl,
  title,
  autoSave = true,
  initialPosition = 0,
  onProgress,
  onComplete,
  isPreview = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [lastSavedPosition, setLastSavedPosition] = useState(initialPosition);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Detect YouTube or Vimeo URLs
  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
  const isVimeo = videoUrl?.includes('vimeo.com');
  
  // Handle external video providers
  const getEmbedUrl = () => {
    if (isYouTube) {
      const videoId = videoUrl.includes('youtu.be') 
        ? videoUrl.split('/').pop() || '' 
        : new URLSearchParams(new URL(videoUrl).search).get('v') || '';
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&modestbranding=1&rel=0`;
    } else if (isVimeo) {
      const videoId = videoUrl.split('/').pop() || '';
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return '';
  };

  // Initialize video player
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition]);

  // Handle video metadata loaded
  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Play/pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play()
          .catch(error => {
            console.error('Video playback error:', error);
            toast({
              title: 'Playback Error',
              description: 'There was an issue playing this video. Please try again.',
              variant: 'destructive'
            });
          });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Mute/unmute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Handle seek in video
  const handleSeek = (value: number[]) => {
    const seekTime = (value[0] / 100) * duration;
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      // Calculate progress percentage
      const progressPercent = (current / duration) * 100;
      setProgress(progressPercent);
      
      // Call onProgress callback
      if (onProgress) {
        onProgress(progressPercent);
      }
      
      // Check if video is complete
      if (progressPercent > 95) {
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  // Save progress to server
  const saveProgress = async () => {
    if (!isAuthenticated || !autoSave || isPreview) return;
    
    // Only save if position has changed significantly
    if (Math.abs(currentTime - lastSavedPosition) < 5) return;
    
    try {
      await apiRequest('POST', `/api/lessons/${lessonId}/progress`, {
        progress: progress,
        status: progress > 95 ? 'completed' : 'in_progress',
        playbackPosition: Math.floor(currentTime),
        timeSpent: Math.floor(currentTime - initialPosition),
      });
      setLastSavedPosition(currentTime);
    } catch (error) {
      console.error('Failed to save video progress:', error);
    }
  };

  // Set up auto-save interval
  useEffect(() => {
    if (autoSave && isAuthenticated && !isPreview) {
      progressInterval.current = setInterval(saveProgress, 10000); // Save every 10 seconds
    }
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      // Save on unmount
      saveProgress();
    };
  }, [currentTime, autoSave, isAuthenticated, isPreview]);

  // Handle fullscreen toggle
  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().then(() => {
          setIsFullScreen(true);
        }).catch(err => {
          console.error('Fullscreen error:', err);
        });
      } else {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Format time for display (mm:ss)
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Skip forward 10 seconds
  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + 10, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Skip backward 10 seconds
  const skipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // For external providers like YouTube/Vimeo
  if (isYouTube || isVimeo) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full pt-[56.25%]">
            <iframe 
              className="absolute top-0 left-0 w-full h-full border-0"
              src={getEmbedUrl()}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // For native video player
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative group bg-black">
          <video
            ref={videoRef}
            className="w-full h-auto"
            src={videoUrl}
            poster={posterUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleMetadataLoaded}
            onClick={togglePlay}
            playsInline
          />
          
          {/* Video controls */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress bar */}
            <div className="mb-2">
              <Slider 
                value={[progress]} 
                min={0} 
                max={100} 
                step={0.1}
                onValueChange={handleSeek}
              />
            </div>
            
            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlay}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                </button>
                
                <button
                  onClick={skipBackward}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                  aria-label="Skip backward 10 seconds"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>
                
                <button
                  onClick={skipForward}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                  aria-label="Skip forward 10 seconds"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
                
                <div className="text-xs text-white ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <button
                    onClick={toggleMute}
                    className="p-1 rounded-full hover:bg-white/20 transition"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </button>
                  
                  <div className="w-20 mx-2">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>
                
                <button
                  onClick={toggleFullScreen}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                  aria-label="Fullscreen"
                >
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
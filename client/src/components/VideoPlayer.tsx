import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  src: string;
  title?: string;
  thumbnail?: string;
  className?: string;
}

export default function VideoPlayer({ src, title, thumbnail, className = "" }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Check if it's a YouTube or Vimeo URL
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url; // Direct video URL
  };

  const embedUrl = getEmbedUrl(src);
  const isEmbedded = embedUrl !== src;

  if (isEmbedded) {
    return (
      <div className={`relative rounded-lg overflow-hidden bg-black ${className}`}>
        <iframe
          src={embedUrl}
          title={title || "Video"}
          className="w-full h-full aspect-video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-lg overflow-hidden bg-black group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        className="w-full h-full object-cover aspect-video"
        src={src}
        poster={thumbnail}
        muted={isMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls={showControls}
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <Button
            size="lg"
            className="rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 text-black"
            onClick={() => {
              const video = document.querySelector('video') as HTMLVideoElement;
              video?.play();
            }}
          >
            <Play className="w-6 h-6 ml-1" />
          </Button>
        </div>
      )}

      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black bg-opacity-50 rounded px-3 py-2">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => {
                const video = document.querySelector('video') as HTMLVideoElement;
                if (isPlaying) {
                  video?.pause();
                } else {
                  video?.play();
                }
              }}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => {
                const video = document.querySelector('video') as HTMLVideoElement;
                if (video) {
                  video.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:text-white hover:bg-white hover:bg-opacity-20"
            onClick={() => {
              const video = document.querySelector('video') as HTMLVideoElement;
              video?.requestFullscreen();
            }}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
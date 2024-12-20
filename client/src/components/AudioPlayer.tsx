import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface AudioPlayerProps {
  audioData: string;
  sessionDate: string;
}

interface AudioPlayerProps {
  audioData: string;
  sessionDate: string;
  onComplete?: () => void;
  isCompleted?: boolean;
  showCompletionPrompt?: boolean;
}

export function AudioPlayer({ audioData, sessionDate, onComplete, isCompleted, showCompletionPrompt }: AudioPlayerProps) {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {new Date(sessionDate).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {isOffline ? (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Wifi className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-pulse text-sm text-muted-foreground">
            Loading audio...
          </div>
        </div>
      )}
      
      {loadError && (
        <div className="text-sm text-destructive text-center">
          {loadError}
        </div>
      )}

      <audio
        ref={audioRef}
        src={audioData}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          setIsLoading(false);
          handleLoadedMetadata(e);
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (onComplete && !isCompleted) {
            onComplete();
            setHasReachedEnd(true);
          }
        }}
        onError={(e) => {
          setIsLoading(false);
          const errorMessage = "Failed to load audio track";
          setLoadError(errorMessage);
          toast({
            title: "Error",
            description: `${errorMessage}. The file might be unavailable or in an unsupported format.`,
            variant: "destructive",
          });
          console.error('Audio loading error details:', {
            src: audioRef.current?.src,
            error: e.currentTarget.error
          });
        }}
      />

      <Slider
        max={duration}
        min={0}
        step={0.1}
        value={[currentTime]}
        onValueChange={handleSliderChange}
        className="my-4"
      />

      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isCompleted && (
          <div className="text-center">
            <p className="text-sm text-green-500">✓ Session completed</p>
          </div>
        )}
      </div>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAudio } from "@/hooks/use-audio";
import { useToast } from "@/hooks/use-toast";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { Mic, Square, Bug } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { generateWealthReading } from "./WealthReading";
import { generateDailyInsight } from "../utils/wealthInsights";
import { cn } from "@/lib/utils";

interface Session {
  createdAt: string;
  wealthReading: string;
  wealthScore: number;
  audioUrl: string | null;
  audioData: string;
  gammaSessionCompleted: boolean;
  id: number;
  userId: number;
  dailyWealthInsight: string;
}

interface SessionResponse {
  id: number;
  wealthReading: string;
  wealthScore: number;
  dailyWealthInsight: string;
  createdAt: string;
}

interface SessionData {
  sessions: Session[];
  todaySessionExists: boolean;
  nextRecordingTime?: string;
}

interface AudioRecorderProps {
  userId: string;
}

export function AudioRecorder({ userId }: AudioRecorderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isRecording, recordingTime, startRecording, stopRecording, analyserNode } = useAudio();
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [wealthReading, setWealthReading] = useState<string | null>(null);
  const [wealthScore, setWealthScore] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const { data: sessionData } = useQuery<SessionData>({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      return {
        sessions: data.sessions || [],
        todaySessionExists: data.todaySessionExists || false,
        nextRecordingTime: data.nextRecordingTime
      };
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
  });

  const handleDebugBypass = async () => {
    if (!canRecordToday) {
      toast({
        title: "Recording Complete",
        description: "You've already completed today's voice analysis session.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Determine recording context
      const isFirstRecording = !sessions || sessions.length === 0;
      const currentDay = sessions ? sessions.length : 0;
      const previousScore = sessions && sessions.length > 0 ? sessions[0].wealthScore : 0;
      const previousDaySession = sessions && sessions.length > 0 ? sessions[0] : null;
      const previousDayGammaCompleted = previousDaySession?.gammaSessionCompleted || false;

      // Generate a mock audio blob
      const mockAudioBlob = new Blob(['mock-audio-data'], { type: 'audio/wav' });
      
      // Calculate score using the same logic
      // Use same wealth score calculation logic
      const score = isFirstRecording ? 
        Math.floor(Math.random() * 16) + 10 : // Initial score between 10-25
        Math.min(
          previousScore + 3, // Max daily increase of 3
          Math.min(Math.round(previousScore * 1.15), 100) // Max 15% increase, capped at 100
        );

      // Start processing animation
      const processingInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const next = prev + (Math.random() * 5);
          return next > 100 ? 100 : next;
        });
      }, 200);

      // Convert mock audio to base64
      const base64AudioData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(mockAudioBlob);
      });

      // Save session to server
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          wealthScore: score,
          audioUrl: null,
          audioData: base64AudioData,
          wealthReading: generateWealthReading(score),
          dailyWealthInsight: generateDailyInsight(),
          gammaSessionCompleted: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save session');
      }

      const sessionData: SessionResponse = await response.json();
      
      console.log('[AudioRecorder] Session saved with insights:', {
        wealthScore: score,
        hasWealthReading: !!sessionData.wealthReading,
        hasDailyInsight: !!sessionData.dailyWealthInsight,
        timestamp: new Date().toISOString()
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      clearInterval(processingInterval);

      setWealthReading(sessionData.wealthReading);
      setWealthScore(sessionData.wealthScore);

      toast({
        title: "Debug Session Saved",
        description: "Voice analysis session has been bypassed and recorded successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });

    } catch (error) {
      console.error('Error in debug bypass:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save debug session",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // In debug mode, always allow recording
  const canRecordToday = userData?.isDebug || !sessionData?.todaySessionExists;
  const sessions = sessionData?.sessions || [];

  // Initialize wealth reading from latest session
  useEffect(() => {
    if (sessions.length > 0) {
      const latestSession = sessions[0];
      if (latestSession.wealthReading) {
        setWealthReading(latestSession.wealthReading);
        setWealthScore(latestSession.wealthScore);
      }
    }
  }, [sessions]);

  const handleStartRecording = async () => {
    setRecordingError(null);
    try {
      await startRecording(() => handleStopRecording());
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone access.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    // Only allow stopping at exactly 30 seconds
    if (recordingTime < 30) {
      return;
    }

    // If recording is not active, don't proceed
    if (!isRecording) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Determine recording context
      const isFirstRecording = !sessions || sessions.length === 0;
      const currentDay = sessions ? sessions.length : 0;
      const previousScore = sessions && sessions.length > 0 ? sessions[0].wealthScore : 0;
      const previousDaySession = sessions && sessions.length > 0 ? sessions[0] : null;
      const previousDayGammaCompleted = previousDaySession?.gammaSessionCompleted || false;

      const result = await stopRecording(
        isFirstRecording, 
        currentDay, 
        previousScore, 
        previousDayGammaCompleted
      );
      
      if (!result) {
        setIsProcessing(false);
        return;
      }
      
      const { audioBlob, score, voiceMetrics } = result;
      
      if (!voiceMetrics.hasSpokenEnough) {
        toast({
          title: "Not Enough Voice Detected",
          description: "Please record again while speaking clearly for at least 15 seconds.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Start processing animation
      setProcessingProgress(0);
      const processingInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const next = prev + (Math.random() * 5);
          return next > 100 ? 100 : next;
        });
      }, 200);

      // Convert audio to base64
      const base64AudioData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert audio to base64'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(audioBlob);
      });

      // Save session to server
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          wealthScore: score,
          audioUrl: null,
          audioData: base64AudioData,
          wealthReading: generateWealthReading(score),
          gammaSessionCompleted: false,
        }),
      });

      if (response.status === 429) {
        setRecordingError('Recording completed for today. Your next session will be available tomorrow.');
        throw new Error('Only one recording per day is allowed');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save session');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 15000));
      clearInterval(processingInterval);

      const sessionData: SessionResponse = await response.json();
      setWealthReading(sessionData.wealthReading);
      setWealthScore(sessionData.wealthScore);

      toast({
        title: "Session Saved",
        description: "Your voice analysis session has been recorded successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });

    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save session",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 space-y-4 bg-card/50 backdrop-blur-sm border-primary/20 shadow-glow">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Voice Analysis</h2>
        <div className="text-sm text-muted-foreground">
          {isProcessing ? 'Processing...' : `${formatTime(recordingTime)} / 0:30`}
        </div>
      </div>

      <Progress 
        value={isProcessing ? processingProgress : (recordingTime / 30) * 100} 
        className={cn(
          "transition-all duration-500",
          isProcessing && "bg-primary/20 [&>[data-progress]]:bg-primary/60"
        )}
      />

      <WaveformVisualizer
        analyserNode={analyserNode}
        isRecording={isRecording}
      />

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          {canRecordToday && !isProcessing ? (
                <>
                  <div className="flex flex-col gap-4 items-center">
                    {userData?.subscriptionStatus === 'free' && sessions.length > 0 ? (
                      <div className="text-center space-y-4">
                        <p className="text-muted-foreground">
                          Start your trial to generate your personalized 7-minute wealth attraction neural tracks and continue analysing your wealth score daily
                        </p>
                        <Button
                          size="lg"
                          variant="default"
                          onClick={() => window.location.href = '/trial'}
                          className="w-full max-w-sm"
                        >
                          Upgrade Now
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        variant={isRecording ? "secondary" : "default"}
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        disabled={isRecording && recordingTime < 30}
                        className="w-full max-w-sm"
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            {recordingTime < 30 ? 
                              `Recording... (${30 - recordingTime}s remaining)` : 
                              'Complete Recording'}
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>
                    )}
                    
                    {userData?.isDebug && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDebugBypass}
                        className="w-full max-w-sm border-primary/20 hover:bg-primary/5"
                      >
                        <Bug className="w-4 h-4 mr-2" />
                        Debug: Skip Recording
                      </Button>
                    )}
                  </div>
                  {isRecording && (
                    <div className="text-sm text-muted-foreground mt-2 text-center">
                      Please speak clearly for at least 15 seconds during the recording.
                    </div>
                  )}
                </>
          ) : (
            <p className="text-muted-foreground text-sm">
              {isProcessing ? 'Processing your recording...' : 'You\'ve completed today\'s recording session. Please return tomorrow for your next session.'}
            </p>
          )}
        </div>

        {isProcessing ? (
          <div className="text-center">
            <p className="text-lg font-medium">Processing...</p>
            <Progress value={processingProgress} />
          </div>
        ) : wealthScore > 0 && (
          <div className="text-center">
            <p className="text-lg font-medium">Wealth Alignment Score</p>
            <p className="text-3xl font-bold text-primary">{wealthScore}</p>
          </div>
        )}

        {recordingError && (
          <div className="text-center text-destructive">
            <p>{recordingError}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
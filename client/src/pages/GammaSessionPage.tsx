import { useState, useEffect } from "react";
import { getRandomAudioForType } from "@/lib/audioFiles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FrequencySelector, FREQUENCY_TYPES } from "@/components/FrequencySelector";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import type { Session } from "@db/schema";
import { PremiumFeature } from "@/components/PremiumFeature";

interface SessionData {
  sessions: Session[];
  todaySessionExists: boolean;
  nextRecordingTime: string | null;
  currentDayNumber: number;
}

interface SessionAvailability {
  canGenerate: boolean;
  reason: string | null;
  debugTime?: {
    current: string;
    dayNumber: number;
  };
}

export default function GammaSessionPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFrequency, setSelectedFrequency] = useState<string>("");
  
  // Get user subscription status
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [nextAvailableTime, setNextAvailableTime] = useState<string | null>(null);

  // Get current day info to detect changes
  interface DayInfo {
    currentDay: number;
    currentStreak: number;
    longestStreak: number;
    nextSessionTime: string;
  }

  const { data: dayInfo } = useQuery<DayInfo>({
    queryKey: ["/api/user/day-info"],
    enabled: !!user,
    refetchInterval: 60000, // Check every minute
  });

  // Watch for day changes and refresh data accordingly
  useEffect(() => {
    if (dayInfo?.currentDay !== undefined) {
      // Refresh data when day changes
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/neural-session/check"] });
    }
  }, [dayInfo?.currentDay, queryClient]);

  // Query to check if user can generate a session today and handle day changes
  const { data: sessionData } = useQuery({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();

      // Check for day change and refresh queries if needed
      if (data.currentDayNumber !== sessionData?.currentDayNumber) {
        console.log('Day changed, refreshing session data:', {
          oldDay: sessionData?.currentDayNumber,
          newDay: data.currentDayNumber
        });
        queryClient.invalidateQueries({ queryKey: ["/api/neural-session/check"] });
      }

      return data;
    },
    refetchInterval: 60000, // Refresh every minute to catch day changes
  });

  const { data: sessionAvailability, isError, error } = useQuery({
    queryKey: ["/api/neural-session/check"],
    queryFn: async () => {
      const response = await fetch("/api/neural-session/check", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to check session availability");
      }
      const data = await response.json();

      // If we detect a day change, refresh relevant queries
      if (dayInfo && data.debugTime?.dayNumber !== dayInfo.currentDay) {
        console.log('Day changed in neural session check:', {
          oldDay: dayInfo.currentDay,
          newDay: data.debugTime?.dayNumber
        });
        queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      }

      return data;
    },
    refetchInterval: 30000, // Check more frequently to catch day changes
  });

  // Get the most recent gamma session
  const latestSession = sessionData?.sessions?.[0];

  // Use the API's canGenerate flag to determine if we can generate a new session
  const canGenerateToday = sessionAvailability?.canGenerate ?? false;
  const availabilityMessage = sessionAvailability?.reason || null;

  // Get previous completed gamma sessions
  const previousSessions = sessionData?.sessions
    ?.filter((session: Session) => session.hasGeneratedGammaSession && session.gammaSessionCompleted)
    .slice(1, 6) || []; // Skip the latest session and get next 5

  const handleSessionComplete = async () => {
    try {
      // Optimistically update UI state
      queryClient.setQueryData(["/api/sessions"], (oldData: any) => {
        if (!oldData?.sessions?.length) return oldData;
        const newSessions = [...oldData.sessions];
        if (newSessions[0]) {
          newSessions[0] = { ...newSessions[0], gammaSessionCompleted: true };
        }
        return { ...oldData, sessions: newSessions };
      });

      const response = await fetch('/api/sessions/complete-gamma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to mark session as completed');
      }

      // Silently refresh queries in background
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/neural-session/check"] });

    } catch (error) {
      console.error('Error completing session:', error);
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete session",
        variant: "destructive",
      });
    }
  };

  const generateGammaSession = async () => {
    console.log('Generate button clicked, selected frequency:', selectedFrequency);

    if (!selectedFrequency) {
      toast({
        title: "Error",
        description: "Please select a frequency type first",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerateToday) {
      toast({
        title: "Error",
        description: availabilityMessage || "You've already generated a session today.",
        variant: "destructive",
      });
      return;
    }

    const frequencyType = FREQUENCY_TYPES[selectedFrequency as keyof typeof FREQUENCY_TYPES];
    if (!frequencyType) {
      console.error('Invalid frequency type selected:', selectedFrequency);
      toast({
        title: "Error",
        description: "Invalid frequency type selected",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationMessage(`Preparing your personalized ${frequencyType.name} activation audio...`);

    try {
      // Simulate processing time for better UX
      for (let i = 0; i <= 100; i++) {
        await new Promise(resolve => setTimeout(resolve, 15));
        setProcessingProgress(i);
      }

      console.log('Starting audio file fetch from server');
      const audioIndex = Math.floor(Math.random() * 18);
      console.log('Selected audio index:', audioIndex);
      
      // Get audio file from the server
      const response = await fetch(`/api/audio/track?index=${audioIndex}`);
      console.log('Audio fetch response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Audio fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch audio file: ${response.statusText} - ${errorText}`);
      }

      // Get the audio data regardless of content-type header
      const audioBlob = await response.blob();
      console.log('Received audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type,
        validSize: audioBlob.size > 0,
        contentType: response.headers.get('content-type')
      });

      // Basic validation of the blob size
      if (audioBlob.size === 0) {
        console.error('Empty audio blob received');
        throw new Error('Audio file appears to be empty');
      }

      // Simple validation - just check if we can create an Audio object
      const testAudio = new Audio();
      const objectUrl = URL.createObjectURL(audioBlob);
      console.log('Created object URL for validation:', objectUrl);

      try {
        testAudio.src = objectUrl;

        // Wait for either canplaythrough or error event
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.error('Audio loading timed out after 10 seconds');
            reject(new Error('Audio file loading timed out'));
          }, 10000);

          testAudio.addEventListener('canplaythrough', () => {
            console.log('Audio validation successful - can play through');
            clearTimeout(timeout);
            resolve(true);
          }, { once: true });

          testAudio.addEventListener('error', () => {
            console.error('Audio validation failed:', testAudio.error);
            clearTimeout(timeout);
            reject(new Error(`Audio validation failed: ${testAudio.error?.message || 'Unknown error'}`));
          }, { once: true });
        });

      } catch (error) {
        console.error('Audio validation error:', error);
        throw error;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      console.log('Starting neural session generation request');
      const requestData = {
        frequencyType: selectedFrequency,
        audioData: base64Data,
        hasGeneratedGammaSession: true,
        gammaSessionGeneratedAt: new Date().toISOString()
      };
      console.log('Neural session request payload:', {
        frequencyType: requestData.frequencyType,
        audioDataLength: requestData.audioData.length,
        timestamp: requestData.gammaSessionGeneratedAt
      });

      // Generate the neural session on the server
      const generateResponse = await fetch("/api/neural-session/generate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      console.log('Neural session generation response:', {
        status: generateResponse.status,
        statusText: generateResponse.statusText,
        headers: Object.fromEntries(generateResponse.headers.entries())
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('Neural session generation failed:', {
          status: generateResponse.status,
          statusText: generateResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to generate neural session: ${errorText}`);
      }

      const responseData = await generateResponse.json();
      console.log('Neural session generation succeeded:', responseData);

      // Invalidate both session and availability queries to refresh the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/neural-session/check"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/sessions"] })
      ]);

      toast({
        title: "Success",
        description: "Neural optimization track prepared successfully",
      });

    } catch (error) {
      console.error('Error preparing gamma session:', error);
      toast({
        title: "Error",
        description: error instanceof Error
          ? `Failed to prepare audio: ${error.message}`
          : "Failed to prepare audio track",
        variant: "destructive",
      });
      // Clear any state related to audio generation
      setGenerationMessage("");
      setProcessingProgress(0);
    } finally {
      setIsGenerating(false);
      setGenerationMessage("");
      setProcessingProgress(0); // Reset progress
    }
  };

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <p className="text-destructive">Failed to load session data. Please try again later.</p>
        </Card>
      </div>
    );
  }

  const subscriptionStatus = userData?.subscriptionStatus || 'trial';
  
  return (
    <PremiumFeature 
      subscriptionStatus={subscriptionStatus}
      sessionCount={sessionData?.sessions?.length}
    >
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Neural Optimization Tracks</h1>

        <div className="prose prose-neutral dark:prose-invert mb-6">
          <p>
            Choose your personalized frequency track for enhanced neural alignment.
            Each 7-minute session is designed to optimize specific aspects of your
            wealth consciousness.
          </p>
        </div>

        <FrequencySelector
          selectedFrequency={selectedFrequency}
          onFrequencySelect={setSelectedFrequency}
        />

        <Card className="p-6 mt-6 space-y-4">
          {/* Always show generation button if canGenerateToday is true */}
          {canGenerateToday && (
            <div className="space-y-4">
              <Button
                onClick={generateGammaSession}
                disabled={isGenerating || !selectedFrequency}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Session...
                  </>
                ) : (
                  "Generate Selected Session"
                )}
              </Button>
              {isGenerating && (
                <div className="space-y-4">
                  <Progress value={processingProgress} />
                  <p className="text-center text-sm text-muted-foreground">
                    {generationMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Show latest session if it exists */}
          {latestSession?.hasGeneratedGammaSession && latestSession?.audioData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-center text-muted-foreground">
                  {canGenerateToday ? 'Previous session:' : 'Current session:'}
                </p>
                <AudioPlayer
                    audioData={latestSession.audioData}
                    sessionDate={new Date(latestSession.createdAt).toISOString()}
                    onComplete={handleSessionComplete}
                    isCompleted={latestSession.gammaSessionCompleted}
                    showCompletionPrompt={!latestSession.gammaSessionCompleted}
                  />
                  {latestSession.gammaSessionCompleted ? (
                    <p className="text-center text-sm text-green-500">
                      ✓ Session completed
                    </p>
                  ) : (
                    <p className="text-center text-sm text-yellow-500">
                      ⚡ Session ready - Complete by listening fully
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* Show message when voice analysis is not completed for today */}
          {(!sessionData?.todaySessionExists || (!canGenerateToday && !latestSession?.gammaSessionCompleted)) && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                {availabilityMessage || "Complete today's voice analysis first to generate a neural optimization track."}
              </p>
            </div>
          )}

          {/* Always show previous sessions if they exist */}
          {previousSessions.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold">Previous Sessions</h3>
              <div className="grid gap-4">
                {previousSessions.map((session: Session) => (
                  <AudioPlayer
                    key={session.id}
                    audioData={session.audioData || ''}
                    sessionDate={new Date(session.createdAt).toISOString()}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
      </div>
    </PremiumFeature>
  );
}
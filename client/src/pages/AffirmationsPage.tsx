import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lock, Crown, Mic } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { useAudio } from "@/hooks/use-audio";

const AFFIRMATIONS = {
  identity: [
    "I am naturally aligned with wealth and abundance",
    "My mind is programmed for exceptional financial success",
    "I am worthy of extraordinary wealth and prosperity",
    "My neural patterns are perfectly tuned to attract money",
    "I embody the wealth frequency of the ultra-successful",
    "My brain is wired for unlimited financial abundance",
    "I am a powerful creator of wealth and prosperity",
    "My neural circuitry is optimized for massive wealth creation",
    "I carry the wealth frequency patterns of billionaires",
    "My DNA resonates perfectly with financial abundance",
    "I am genetically coded for exponential prosperity",
    "My brain waves naturally attract unlimited resources"
  ],
  abundance: [
    "Money flows to me easily and effortlessly",
    "Wealth surrounds me in expected and unexpected ways",
    "My financial success benefits everyone around me",
    "I see abundant opportunities in every situation",
    "My wealth consciousness expands infinitely each day",
    "The universe conspires to increase my wealth daily",
    "My capacity to receive wealth is unlimited",
    "Wealth accelerates towards me at quantum speed",
    "My prosperity field magnetizes infinite opportunities",
    "Money multiplies effortlessly in my energy field",
    "My wealth frequency amplifies everything I touch",
    "Abundance flows through my optimized neural pathways"
  ],
  action: [
    "I take inspired actions that multiply my wealth",
    "I make decisions with confidence and financial clarity",
    "I recognize and seize lucrative opportunities instantly",
    "My actions align perfectly with wealth creation",
    "I execute my wealth-building plans with precision",
    "Every action I take increases my net worth",
    "I naturally choose the most profitable path forward",
    "My neural patterns automatically generate wealth",
    "I attract strategic opportunities at the perfect frequency",
    "My wealth DNA activates profitable decisions instantly",
    "I manifest abundance through aligned action",
    "My brain waves synchronize with perfect timing"
  ],
  gratitude: [
    "I am deeply grateful for my growing wealth",
    "I appreciate the abundance that flows into my life",
    "Thank you for my perfect wealth alignment",
    "I am thankful for my natural ability to create wealth",
    "Gratitude amplifies my wealth frequency daily",
    "I appreciate every dollar that flows to me",
    "Thank you for my increasing financial success",
    "I am grateful for my optimized wealth frequency",
    "Thank you for my perfectly aligned neural patterns",
    "Deep gratitude activates my abundance DNA",
    "I appreciate my natural wealth magnetism",
    "Thank you for my quantum wealth acceleration"
  ]
};

const SESSION_DURATION = 300; // 5 minutes in seconds

export default function AffirmationsPage() {
  const queryClient = useQueryClient();
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isRecordingStarted, setIsRecordingStarted] = useState(false);
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);
  const { isRecording, recordingTime, startRecording, stopRecording, analyserNode } = useAudio();
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Get user subscription status and voice analysis data
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      console.log('[Affirmations] Fetching user data...');
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      console.log('[Affirmations] User data response:', {
        status: response.status,
        ok: response.ok
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      const data = await response.json();
      console.log('[Affirmations] User data received:', {
        hasData: !!data,
        subscriptionStatus: data?.subscriptionStatus
      });
      return data;
    },
  });

  const { data: sessionData } = useQuery({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      console.log('[Affirmations] Fetching session data...');
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      console.log('[Affirmations] Session data response:', {
        status: response.status,
        ok: response.ok
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      console.log('[Affirmations] Session data received:', {
        hasData: !!data,
        sessionCount: data?.sessions?.length,
        hasTodaySession: !!data?.todaySession
      });
      return data;
    },
  });

  // Track if today's affirmation session is completed via API
  const { data: todayAffirmationData, isLoading: isAffirmationStatusLoading } = useQuery({
    queryKey: ["/api/sessions/today-affirmation"],
    queryFn: async () => {
      console.log('[Affirmations] Checking today\'s affirmation status...');
      const response = await fetch("/api/sessions/today-affirmation", {
        credentials: "include",
      });
      console.log('[Affirmations] Today\'s affirmation status response:', {
        status: response.status,
        ok: response.ok
      });
      if (!response.ok) {
        throw new Error("Failed to fetch today's affirmation status");
      }
      const data = await response.json();
      console.log('[Affirmations] Today\'s affirmation status:', {
        completed: data?.completed
      });
      return data;
    },
  });

  const todaySessionCompleted = todayAffirmationData?.completed || false;
  console.log(`todaySessionCompleted is ${todaySessionCompleted}`)
  const completeMutation = useMutation({
    mutationFn: async () => {
      console.log('[Affirmations] Starting session completion...');
      try {
        // Check if session already completed today
        console.log('[Affirmations] Checking session status:', {
          todaySessionCompleted,
          timeSpent: SESSION_DURATION - timeRemaining
        });

        if (todaySessionCompleted) {
          console.warn('[Affirmations] Attempted to complete already completed session');
          throw new Error('You have already completed your affirmation session for today. Please return tomorrow.');
        }

        console.log('[Affirmations] Sending completion request:', {
          affirmationCount: selectedAffirmations.length,
          timeSpent: SESSION_DURATION - timeRemaining
        });

        // Mark session as completed via API
        const response = await fetch("/api/sessions/complete-affirmation", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            affirmations: selectedAffirmations,
            completionTime: new Date().toISOString(),
            timeSpent: SESSION_DURATION - timeRemaining
          }),
        });

        console.log('[Affirmations] Completion response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Affirmations] Completion failed:', {
            status: response.status,
            error: errorText
          });
          throw new Error(errorText || "Failed to complete session");
        }

        console.log('[Affirmations] Session completed successfully');
        return {
          success: true,
          message: "Session completed successfully"
        };
      } catch (error: any) {
        console.error('[Affirmations] Completion error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    },
    onSuccess: async (data) => {
      try {
        // Immediately invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/sessions/today-affirmation"] });

        // Update UI state
        setSessionCompleted(true);
        setIsSessionStarted(false);
        setIsRecordingStarted(false);
        setSelectedAffirmations([]);

        // Stop recording if still active
        if (stopRecording) {
          stopRecording();
        }

        console.log('Session completed successfully.');
      } catch (error) {
        console.error('Error updating queries:', error);
      }
    },
    onError: (error: Error) => {
      console.error('Session completion error:', error);
      setIsTimerComplete(true);
      stopRecording();
    },
  });

  // Start affirmation session and get daily affirmations
  const startSession = async () => {
    console.log('[Affirmations] Starting new session...');
    try {
      console.log('[Affirmations] Sending start session request...');
      const response = await fetch("/api/sessions/start-affirmations", {
        method: "POST",
        credentials: "include",
      });

      console.log('[Affirmations] Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('[Affirmations] Start session failed:', {
          status: response.status,
          error: error
        });
        throw new Error(error);
      }

      const data = await response.json();
      console.log('[Affirmations] Session started successfully:', {
        dataReceived: !!data,
        affirmationsReceived: !!data.affirmations
      });

      const selected = Object.values(data.affirmations).flat();
      console.log('[Affirmations] Processed affirmations:', {
        totalSelected: selected.length,
        firstAffirmation: selected[0]
      });

      setSelectedAffirmations(selected);
      setIsSessionStarted(true);
      console.log('[Affirmations] State updated, session started');
    } catch (error) {
      console.error('[Affirmations] Session start error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Handle error appropriately
    }
  };

  // Load existing affirmations when returning to the page
  useEffect(() => {
    console.log('[Affirmations] Checking for existing session data:', {
      hasSessionData: !!sessionData,
      hasTodaySession: !!sessionData?.todaySession,
      hasAffirmations: !!sessionData?.todaySession?.dailyAffirmations
    });

    if (sessionData?.todaySession?.dailyAffirmations) {
      const affirmations = sessionData.todaySession.dailyAffirmations;
      const selected = Object.values(affirmations).flat();
      console.log('[Affirmations] Loading existing affirmations:', {
        count: selected.length
      });
      setSelectedAffirmations(selected);
    }
  }, [sessionData?.todaySession?.dailyAffirmations]);

  useEffect(() => {
    if (isRecordingStarted) {
      // Start 5-minute timer when recording begins
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsTimerComplete(true);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isRecordingStarted]);

  // Reset states when session is completed
  useEffect(() => {
    if (sessionCompleted) {
      setTimeRemaining(SESSION_DURATION);
      setIsTimerComplete(false);
      setIsRecordingStarted(false);
      if (stopRecording) {
        stopRecording();
      }
    }
  }, [sessionCompleted, stopRecording]);

  // Check user's subscription status
  const subscriptionStatus = userData?.subscriptionStatus || 'trial';
  const isPaidUser = subscriptionStatus === "paid";
  const isFreeUser = subscriptionStatus === "free";
  const isTrialUser = subscriptionStatus === "trial";
  const hasEnoughData = sessionData?.sessions?.length >= 7;

  // Helper function to determine if user has access
  const hasAccess = isPaidUser && (!isTrialUser || hasEnoughData);
   
  // Show loading skeleton while data is being fetched
  if (!userData || !sessionData || isAffirmationStatusLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    );
  }

  // Show locked interface for non-paid users
  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-center">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">
              {isTrialUser ? 'Neural Calibration in Progress' : 'Premium Feature'}
            </h2>
            <p className="text-muted-foreground">
              {isTrialUser
                ? "Your Neural Wealth Pattern is currently calibrating. The system requires 7 days of voice data to generate affirmations that perfectly match your unique brain frequency."
                : "Upgrade to Premium to unlock personalized wealth affirmations calibrated to your unique neural frequency pattern."
              }
            </p>
            {isTrialUser && (
              <>
                <Progress value={(sessionData.sessions.length / 7) * 100} className="bg-primary/10" />
                <p className="text-sm text-muted-foreground">
                  {sessionData.sessions.length}/7 days completed
                </p>
              </>
            )}
          </div>
          <div className="bg-muted/50 p-4 rounded-lg blur-sm">
            <p className="text-center italic text-primary/70">
              "I am naturally aligned with wealth and abundance..."
            </p>
            {subscriptionStatus !== 'trial' && (
              <Button
                variant="outline"
                className="w-full mt-4 border-primary/20 hover:bg-primary/5"
                onClick={() => window.location.href = '/upgrade'}
              >
                Upgrade to Premium
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Show completed message if session is already done for today
  if (sessionCompleted || todaySessionCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Daily Affirmations</h2>
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
            </div>
            <div>
              <div className="text-xl font-semibold text-primary">
                Daily Affirmation Complete
              </div>
              <div className="text-sm font-medium text-primary mt-4">
                Please return tomorrow for your next wealth frequency calibration session.
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Personalized Wealth Affirmations</h2>
          <Crown className="h-6 w-6 text-yellow-500" />
        </div>

        <p className="text-muted-foreground">
          Your Neural Wealth Pattern has been analyzed. These affirmations are precisely calibrated
          to your unique brain wave frequency for maximum impact.
        </p>

        <div className="space-y-6">
          {!isSessionStarted ? (
            <Button
              className="w-full"
              onClick={startSession}
            >
              Start Affirmation Session
            </Button>
          ) : (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-background/90 to-background/60 backdrop-blur-xl border-primary/20">
                <div className="space-y-6">
                  {Object.entries(AFFIRMATIONS).map(([category, _], categoryIndex) => {
                    const categoryAffirmations = selectedAffirmations.slice(categoryIndex * 3, (categoryIndex + 1) * 3);
                    return (
                      <div key={category} className="space-y-3">
                        <h3 className="text-sm uppercase tracking-wider text-primary/70 font-semibold">
                          {category.charAt(0).toUpperCase() + category.slice(1)} Affirmations
                        </h3>
                        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                          {categoryAffirmations.map((affirmation, index) => (
                            <p key={index} className="text-lg font-medium leading-relaxed">
                              {affirmation}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4 border-primary/20">
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground">
                    Read each affirmation slowly and mindfully. Feel their resonance with your neural patterns.
                    <br />Continue for the full 5-minute session to lock in your frequency alignment.
                  </div>

                  {!sessionData?.todaySessionExists ? (
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        Please complete today's voice analysis session before recording your affirmations.
                      </p>
                    </div>
                  ) : !isRecordingStarted ? (
                    <Button
                      className="w-full"
                      onClick={async () => {
                        try {
                          await startRecording();
                          setIsRecordingStarted(true);
                        } catch (error) {
                          console.error('Failed to start recording:', error);
                        }
                      }}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Begin Recording
                    </Button>
                  ) : !isTimerComplete ? (
                    <>
                      <WaveformVisualizer
                        analyserNode={analyserNode}
                        isRecording={isRecording}
                      />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          Time Remaining
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        Session Complete!
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        You can now complete your session
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {isTimerComplete && !sessionCompleted && (
                <Button
                  className="w-full"
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? 'Completing Session...' : 'Complete Session'}
                </Button>
              )}

              {completeMutation.isError && (
                <Card className="p-4 border-destructive/20 bg-destructive/10">
                  <div className="text-center text-sm text-destructive">
                    {completeMutation.error?.message || 'Failed to complete session. Please try again.'}
                  </div>
                </Card>
              )}

              {userData?.isDebug && !isTimerComplete && (
                <Button
                  variant="outline"
                  className="w-full border-primary/20 hover:bg-primary/5"
                  onClick={() => {
                    setTimeRemaining(0);
                    setIsTimerComplete(true);
                  }}
                >
                  Debug: Skip Timer
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AudioRecorder } from "@/components/AudioRecorder";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Dashboard } from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { LogOut, CalendarDays } from "lucide-react";
import type { Session } from "@db/schema";
import { WealthReading } from "@/components/WealthReading";
import { DailyWealthInsight } from "@/components/DailyWealthInsight";
import { DailyOverlay } from "@/components/DailyOverlay";
import { ScriptOfTheDay } from "@/components/ScriptOfTheDay";

export default function HomePage() {
  const { user, logout } = useUser();
  const queryClient = useQueryClient();

  // Keep user data in sync and check for day changes
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user"],
    enabled: !!user,
    staleTime: 0,
    refetchInterval: 60000, // Check every minute
  });

  // Wait for user data before enabling other queries
  const queriesEnabled = !!user && !userLoading;

  // Get current day info to detect changes
  const { data: dayInfo, isLoading: dayInfoLoading } = useQuery<{
    currentDay: number;
    currentStreak: number;
    longestStreak: number;
  }>({
    queryKey: ["/api/user/day-info"],
    enabled: queriesEnabled,
    refetchInterval: 60000, // Check every minute
    onSuccess: (newDayInfo) => {
      if (dayInfo && newDayInfo.currentDay !== dayInfo.currentDay) {
        queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      }
    }
  });

  const { data: sessionData, isLoading: sessionsLoading, error: sessionError } = useQuery({
    queryKey: ["/api/sessions"],
    enabled: queriesEnabled,
    queryFn: async () => {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      if (!response.ok) {
        console.error('[HomePage] Failed to fetch sessions:', response.status);
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      return {
        sessions: data.sessions || [],
        todaySessionExists: data.todaySessionExists || false,
        nextRecordingTime: data.nextRecordingTime,
        currentDayNumber: data.currentDayNumber
      };
    },
  });

  // Extract sessions and check current day status
  const sessions = sessionData?.sessions || [];
  const latestSession = sessions[0];
  const canRecordToday = !sessionData?.todaySessionExists;

  const formattedSessions = sessions.map(session => {
    const formatted = {
      createdAt: session.createdAt,
      wealthScore: session.wealthScore,
      gammaSessionCompleted: session.gammaSessionCompleted || false,
    };
    return formatted;
  });

  // Extract wealth reading from latest session
  const latestWealthReading = latestSession?.wealthReading;
  const latestWealthScore = latestSession?.wealthScore;

  // Combine all loading states
  const isLoading = userLoading || dayInfoLoading || sessionsLoading;

  // Log any session fetch errors
  React.useEffect(() => {
    if (sessionError) {
      console.error('[HomePage] Session fetch error:', {
        error: sessionError instanceof Error ? {
          message: sessionError.message,
          stack: sessionError.stack
        } : 'Unknown error type',
        timestamp: new Date().toISOString()
      });
    }
  }, [sessionError]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
        <header className="border-b border-cyan-900/30 bg-black/40 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="h-8 bg-cyan-900/20 animate-pulse rounded" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-10 bg-cyan-900/20 animate-pulse rounded w-1/3" />
              <div className="h-24 bg-cyan-900/20 animate-pulse rounded" />
              <div className="h-48 bg-cyan-900/20 animate-pulse rounded" />
            </div>
            <div className="hidden lg:block h-96 bg-cyan-900/20 animate-pulse rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
      <header className="border-b border-cyan-900/30 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              NeuroWealth AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-cyan-400/80 font-light">
              Welcome, <span className="font-medium text-cyan-300">{user?.username}</span>
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => logout()}
              className="border-cyan-700/50 hover:bg-cyan-950/30 hover:border-cyan-600/50 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 text-cyan-400" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold">Voice Analysis</h2>
                {dayInfo && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Current Streak:</span>
                      <span className="text-xl font-bold text-cyan-400">{dayInfo.currentStreak}</span>
                      <span className="text-sm text-cyan-400">days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Best Streak:</span>
                      <span className="text-xl font-bold text-cyan-400">{dayInfo.longestStreak}</span>
                      <span className="text-sm text-cyan-400">days</span>
                    </div>
                    {canRecordToday ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-sm text-yellow-500">Ready to Record</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-green-500">Completed Today</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {user?.isDebug && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-700/50 hover:bg-cyan-950/30 hover:border-cyan-600/50 transition-all duration-300 flex items-center gap-2"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug/skip-day', {
                        method: 'POST',
                        credentials: 'include',
                      });
                      if (!response.ok) {
                        throw new Error('Failed to skip day');
                      }
                      const result = await response.json();
                      console.log('Day skipped:', result);
                      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
                      await queryClient.invalidateQueries({ 
                        queryKey: ["/api/user/day-info"],
                        refetchType: 'active'
                      });
                    } catch (error) {
                      console.error('Error skipping day:', error);
                    }
                  }}
                >
                  <CalendarDays className="h-4 w-4 text-cyan-400" />
                  Skip Day
                </Button>
              )}
            </div>
            <div className="prose prose-neutral dark:prose-invert mb-6">
              <p className="text-foreground/90 leading-relaxed">
                Record your voice for 30 seconds comfortably reading the Text Of The Day out loud to generate your personalized
                Neural Alignment Score and receive a customized wealth manifestation session. If you get to the end of the text
                before the end of 30 seconds, you can start it again.
              </p>
              <ScriptOfTheDay />
            </div>
            <div className="space-y-6">
              {canRecordToday ? (
                <AudioRecorder userId={user?.id?.toString() || '1'} />
              ) : (
                <div className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 rounded-lg">
                  <p className="text-center text-muted-foreground">
                    You've already recorded your voice analysis for today.
                    Return tomorrow for your next session.
                  </p>
                </div>
              )}
              {latestWealthReading && latestWealthScore && (
                <div className="mt-6">
                  <DailyWealthInsight 
                    key={`insight-${latestSession?.id}`}
                    wealthScore={latestWealthScore}
                    dailyInsight={latestSession?.dailyWealthInsight || null}
                  />
                  <WealthReading 
                    reading={latestWealthReading} 
                    wealthScore={latestWealthScore}
                    userId={user?.id?.toString() || '1'}
                  />
                </div>
              )}
              {userData?.subscriptionStatus === 'free' && latestSession && (
                <div className="mt-8">
                  <Button
                    onClick={() => window.location.href = '/trial'}
                    className="group w-full bg-gradient-to-br from-violet-600 via-primary to-cyan-500 hover:from-violet-500 hover:via-primary/90 hover:to-cyan-400 text-white font-semibold py-5 sm:py-7 rounded-xl border border-primary/20 shadow-lg shadow-primary/20 transition-all duration-300 backdrop-blur-sm relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[url('/wealth-pattern.svg')] opacity-10 group-hover:opacity-20 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-50" />
                    <div className="relative flex flex-col items-center">
                      <span className="text-lg sm:text-xl font-bold tracking-wide bg-gradient-to-r from-cyan-200 via-white to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">✨ Unlock My Wealth Potential</span>
                      <span className="text-xs sm:text-sm text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] mt-0.5 sm:mt-1">Transform Your Financial Future Today</span>
                    </div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                    <div className="absolute -inset-px bg-gradient-to-r from-violet-500/0 via-violet-500/30 to-violet-500/0 group-hover:via-violet-500/50 transition-all duration-500 rounded-xl blur-sm opacity-0 group-hover:opacity-100" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div
            className="hidden lg:block bg-cover bg-center rounded-lg"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1617791160536-598cf32026fb")',
            }}
          />
        </div>

        <section>
          <h2 className="text-3xl font-bold mb-6">Progress Dashboard</h2>
          <Dashboard sessions={formattedSessions} />
          {userData?.subscriptionStatus === 'free' && latestSession && (
            <div className="mt-12 max-w-3xl mx-auto">
              <Button
                onClick={() => window.location.href = '/trial'}
                className="group w-full bg-gradient-to-br from-violet-600 via-primary to-cyan-500 hover:from-violet-500 hover:via-primary/90 hover:to-cyan-400 text-white font-semibold py-7 sm:py-9 rounded-xl border border-primary/20 shadow-lg shadow-primary/20 transition-all duration-300 backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/wealth-pattern.svg')] opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-50" />
                <div className="relative flex flex-col items-center">
                  <span className="text-xl sm:text-2xl font-bold tracking-wide bg-gradient-to-r from-cyan-200 via-white to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">✨ Unlock My Wealth Potential</span>
                  <span className="text-base sm:text-lg text-center text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] max-w-2xl mt-1 sm:mt-2">
                    Get Full Access to Premium Features & Accelerate Your Wealth Journey
                  </span>
                </div>
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                <div className="absolute -inset-px bg-gradient-to-r from-violet-500/0 via-violet-500/30 to-violet-500/0 group-hover:via-violet-500/50 transition-all duration-500 rounded-xl blur-sm opacity-0 group-hover:opacity-100" />
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
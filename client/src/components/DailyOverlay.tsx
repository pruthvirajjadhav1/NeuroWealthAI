import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import type { User } from "@db/schema";

const INSPIRATIONAL_QUOTES = [
  "Your wealth frequency is growing stronger each day.",
  "Every session amplifies your manifestation power.",
  "Your neural pathways are aligning with abundance.",
  "Today's focus creates tomorrow's reality.",
  "Your wealth DNA is activating with each practice."
];

export function DailyOverlay() {
  const { user } = useUser();
  
  const { data: communityStats } = useQuery({
    queryKey: ["/api/community/stats"],
    queryFn: async () => {
      const response = await fetch("/api/community/stats", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch community stats");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get day information from server
  const { data: dayInfo, isLoading: isDayLoading } = useQuery({
    queryKey: ["/api/user/day-info"],
    enabled: !!user,
    refetchInterval: 60000 // Refresh every minute to ensure accuracy
  });

  // Get a consistent quote for the day based on server-provided day number
  const getDailyQuote = () => {
    if (!dayInfo?.currentDay) return INSPIRATIONAL_QUOTES[0];
    return INSPIRATIONAL_QUOTES[(dayInfo.currentDay - 1) % INSPIRATIONAL_QUOTES.length];
  };

  return (
    <Card className="fixed top-16 left-0 right-0 z-50 mx-auto max-w-4xl bg-black/40 backdrop-blur-md border-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.1)] animate-fadeIn">
      <div className="flex items-center justify-between px-6 py-3 text-sm bg-gradient-to-r from-transparent via-cyan-950/30 to-transparent">
        <div className="flex items-center gap-4">
          {isDayLoading ? (
            <div className="h-6 w-24 bg-cyan-900/20 animate-pulse rounded" />
          ) : (
            <span className="font-medium text-cyan-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              Day {dayInfo?.currentDay ?? 1}
            </span>
          )}
          <span className="text-cyan-600">|</span>
          <span className="italic text-cyan-300/90 font-light tracking-wide hover:text-cyan-200 transition-colors">
            {getDailyQuote()}
          </span>
        </div>
        <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded-full border border-cyan-800/30">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          <span className="text-cyan-400/80 font-light">
            {communityStats?.onlineUsers.toLocaleString()} users connected
          </span>
        </div>
      </div>
    </Card>
  );
}

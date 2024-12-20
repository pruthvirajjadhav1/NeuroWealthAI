import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

function WavePattern({ type, matchScore, receptionLevel, color }: {
  type: string;
  matchScore: number;
  receptionLevel: string;
  color: string;
}) {
  return (
    <Card className="flex-1 p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover:shadow-glow transition-shadow duration-300">
      <div className="h-40 relative overflow-hidden mb-4">
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent opacity-30 blur-xl" />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        >
          {type === "current" && (
            <>
              <path
                d={`M 0 50 ${Array.from({ length: 20 }, (_, i) => {
                  const x = i * 5;
                  const y = 50 + Math.sin(i * 0.8) * (7 + Math.random() * 8) + (Math.random() - 0.5) * 15;
                  return `L ${x} ${y}`;
                }).join(" ")}`}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                className="animate-pulse-subtle"
              />
              <path
                d={`M 0 50 ${Array.from({ length: 20 }, (_, i) => {
                  const x = i * 5;
                  const y = 50 + Math.cos(i * 0.5) * (5 + Math.random() * 6) + (Math.random() - 0.5) * 10;
                  return `L ${x} ${y}`;
                }).join(" ")}`}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                opacity="0.5"
                className="animate-pulse-subtle"
              />
            </>
          )}
          {type === "average" && (
            <>
              <path
                d={`M 0 50 ${Array.from({ length: 20 }, (_, i) => {
                  const x = i * 5;
                  const y = 50 + Math.sin(i * 0.4) * 8 + (Math.random() - 0.5) * 4;
                  return `L ${x} ${y}`;
                }).join(" ")}`}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                className="animate-pulse-subtle"
              />
              <path
                d={`M 0 50 ${Array.from({ length: 20 }, (_, i) => {
                  const x = i * 5;
                  const y = 50 + Math.cos(i * 0.3) * 6 + (Math.random() - 0.5) * 3;
                  return `L ${x} ${y}`;
                }).join(" ")}`}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                opacity="0.5"
                className="animate-pulse-subtle"
              />
            </>
          )}
          {type === "optimal" && (
            <>
              <path
                d={`M 0 50 ${Array.from({ length: 20 }, (_, i) => {
                  const x = i * 5;
                  const y = 50 + Math.sin(i * 0.4) * 6;
                  return `L ${x} ${y}`;
                }).join(" ")}`}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                className="animate-pulse-subtle"
              />
              <path
                d={`M 0 50 ${Array.from({ length: 20 }, (_, i) => {
                  const x = i * 5;
                  const y = 50 + Math.cos(i * 0.3) * 4;
                  return `L ${x} ${y}`;
                }).join(" ")}`}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                opacity="0.5"
                className="animate-pulse-subtle"
              />
            </>
          )}
        </svg>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground/90">{type === "current" ? "Your Current Pattern" : type === "average" ? "Average Pattern" : "Optimal Pattern"}</h3>
        <div className="flex justify-between items-center px-4">
          <div>
            <p className="text-sm text-muted-foreground">Match Score</p>
            <p className="text-2xl font-bold" style={{ color }}>{matchScore}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Wealth Reception</p>
            <p className="text-lg font-semibold" style={{ color }}>{receptionLevel}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ResultsPage() {
  const { user } = useUser();
  const { data: sessionData } = useQuery({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      return data;
    },
  });

  const latestSession = sessionData?.sessions?.[0];
  const currentScore = latestSession?.wealthScore || 24; // Default to 24 if no session exists

  useEffect(() => {
    // Redirect premium users to home
    if (user?.subscriptionStatus !== 'free') {
      window.location.href = '/';
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const missingPercentage = 100 - currentScore;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              Your Neural Pattern Analysis Results
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our advanced AI has analyzed your neural patterns to determine your wealth attraction potential.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <WavePattern
              type="current"
              matchScore={currentScore}
              receptionLevel="Limited"
              color="rgb(239, 68, 68)"
            />
            <WavePattern
              type="average"
              matchScore={54}
              receptionLevel="Moderate"
              color="rgb(59, 130, 246)"
            />
            <WavePattern
              type="optimal"
              matchScore={100}
              receptionLevel="Maximum"
              color="rgb(34, 197, 94)"
            />
          </div>

          <div className="mt-12 text-center space-y-6">
            <p className="text-xl text-foreground/90">
              Your brain is missing <span className="text-red-400 font-bold">{missingPercentage}%</span> of wealth signals.
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Begin neural realignment with a free trial to start attracting wealth.
            </p>
            <Button
              onClick={() => window.location.href = '/trial'}
              className="group bg-gradient-to-br from-violet-600 via-primary to-cyan-500 hover:from-violet-500 hover:via-primary/90 hover:to-cyan-400 text-white font-semibold py-6 px-8 rounded-xl border border-primary/20 shadow-lg shadow-primary/20 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('/wealth-pattern.svg')] opacity-10 group-hover:opacity-20 transition-opacity" />
              <span className="relative z-10 text-lg">Start Your Neural Realignment</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

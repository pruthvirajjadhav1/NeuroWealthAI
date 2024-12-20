import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WealthDNAStage } from "@/components/WealthDNAStage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardProps {
  sessions: Array<{
    createdAt: string;
    wealthScore: number;
    gammaSessionCompleted: boolean;
  }>;
}

export function Dashboard({ sessions }: DashboardProps) {
  // Calculate average score with detailed logging
  const averageScore = sessions.length
    ? (() => {
        const totalScore = sessions.reduce((acc, session) => {
          console.log('[Dashboard] Processing session score:', {
            wealthScore: session.wealthScore,
            runningTotal: acc + session.wealthScore,
            createdAt: session.createdAt
          });
          return acc + session.wealthScore;
        }, 0);
        const calculated = Math.round(totalScore / sessions.length);
        console.log('[Dashboard] Average score calculation:', {
          totalScore,
          sessionCount: sessions.length,
          calculatedAverage: calculated
        });
        return calculated;
      })()
    : 0;

  // Group sessions by week
  // Process weekly data with debug logging
  const weeklyData = sessions.reduce((acc, session) => {
    const date = new Date(session.createdAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString();
    console.log('[Dashboard] Processing session for weekly data:', {
      sessionDate: date.toISOString(),
      weekStart: weekKey,
      sessionScore: session.wealthScore,
      gammaCompleted: session.gammaSessionCompleted
    });

    if (!acc[weekKey]) {
      acc[weekKey] = {
        scores: [],
        gammaCompleted: 0
      };
      console.log('[Dashboard] Created new week entry:', weekKey);
    }
    
    acc[weekKey].scores.push(session.wealthScore);
    if (session.gammaSessionCompleted) {
      acc[weekKey].gammaCompleted++;
    }

    console.log('[Dashboard] Updated weekly stats:', {
      week: weekKey,
      currentScores: acc[weekKey].scores,
      totalGammaCompleted: acc[weekKey].gammaCompleted
    });
    
    return acc;
  }, {} as Record<string, { scores: number[], gammaCompleted: number }>);

  // Sort sessions by date and map to day numbers
  // Prepare chart data with comprehensive logging
  // Helper function to sort sessions by date (most recent first)
  const sortSessionsByDate = (sessions: Array<{ createdAt: string }>) => {
    return [...sessions].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Most recent first
    });
  };

  // Get the latest session using the consistent sorting function
  const getLatestSession = () => {
    if (sessions.length === 0) return null;
    const sortedSessions = sortSessionsByDate(sessions);
    const latest = sortedSessions[0];
    console.log('[Dashboard] Latest session calculation:', {
      totalSessions: sessions.length,
      latestSession: {
        createdAt: latest.createdAt,
        wealthScore: latest.wealthScore
      }
    });
    return latest;
  };

  const latestSession = getLatestSession();

  // Sort sessions chronologically for chart display (earliest first)
  const chartData = [...sessions]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((session, index) => {
      const dataPoint = {
        date: `Day ${index + 1}`,
        score: session.wealthScore,
        gammaSessionCompleted: session.gammaSessionCompleted,
        completed: true
      };
      
      console.log('[Dashboard] Generated chart data point:', {
        originalSession: {
          createdAt: session.createdAt,
          wealthScore: session.wealthScore,
          gammaCompleted: session.gammaSessionCompleted
        },
        transformedData: dataPoint,
        dayNumber: index + 1
      });
      
      return dataPoint;
    });

  console.log('[Dashboard] Final chart data summary:', {
    totalPoints: chartData.length,
    firstPoint: chartData[0],
    lastPoint: chartData[chartData.length - 1],
    averageScore
  });

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover:shadow-glow transition-shadow duration-300">
          <h3 className="text-xs sm:text-sm font-medium text-foreground/80">
            Average Wealth Alignment
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-primary animate-glow">{averageScore}</p>
          <Progress value={averageScore} className="mt-2 bg-primary/20" />
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
            Total Sessions
          </h3>
          <p className="text-2xl sm:text-3xl font-bold">{sessions.length}</p>
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
            Latest Score
          </h3>
          <p className="text-2xl sm:text-3xl font-bold">
            {latestSession ? latestSession.wealthScore : "N/A"}
          </p>
        </Card>
      </div>

      {/* Wealth DNA Evolution Stage */}
      {sessions.length > 0 && (
        <WealthDNAStage 
          score={averageScore}
          className="w-full my-4 sm:my-6"
        />
      )}

      <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover:shadow-glow transition-shadow duration-300">
        <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-primary animate-glow">Progress Over Time</h3>
        <div className="h-[250px] sm:h-[300px] relative">
          <div className="absolute inset-0 bg-wealth-pattern opacity-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent opacity-30 blur-xl" />
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 25% 15%)" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(210 40% 98% / 0.5)"
                tick={{ fill: "hsl(210 40% 98% / 0.7)", fontSize: '0.75rem' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="hsl(210 40% 98% / 0.5)"
                tick={{ fill: "hsl(210 40% 98% / 0.7)", fontSize: '0.75rem' }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(230 25% 12%)",
                  border: "1px solid hsl(210 100% 50% / 0.2)",
                  borderRadius: "6px",
                  color: "hsl(210 40% 98%)"
                }}
              />
              <Line
                  key="wealth-score-line"
                  type="monotone"
                  dataKey="score"
                  stroke="url(#progressLine)"
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <g>
                        {/* Base dot for completed voice analysis */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={payload.completed ? "hsl(210, 100%, 50%)" : "hsl(210, 50%, 50%)"}
                          strokeWidth={2}
                          strokeOpacity={0.8}
                        />
                        {/* Outer ring for gamma session completion */}
                        {payload.gammaSessionCompleted && (
                          <g>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={8}
                              fill="none"
                              stroke="hsl(143, 71%, 49%)"
                              strokeWidth={2}
                              className="animate-pulse-subtle"
                            />
                            <circle
                              cx={cx}
                              cy={cy}
                              r={6}
                              fill="none"
                              stroke="hsl(143, 71%, 49%)"
                              strokeWidth={1}
                              strokeDasharray="2,2"
                            />
                          </g>
                        )}
                      </g>
                    );
                  }}
                />
              <g className="legend" transform="translate(250, 20)">
                <circle
                  cx={8}
                  cy={0}
                  r={8}
                  fill="none"
                  stroke="hsl(143, 71%, 49%)"
                  strokeWidth={2}
                  strokeDasharray="2,2"
                />
                <text
                  x={20}
                  y={4}
                  fill="hsl(143, 71%, 49%)"
                  className="text-xs"
                >
                  Session Completed
                </text>
              </g>
              <defs>
                <linearGradient id="progressLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(210, 100%, 60%)" />
                  <stop offset="100%" stopColor="hsl(210, 100%, 40%)" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
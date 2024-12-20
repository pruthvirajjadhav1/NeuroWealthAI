import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceArea,
} from "recharts";
import { Card } from "@/components/ui/card";

interface WealthProjectionChartProps {
  currentScore: number;
}

interface ProjectionDataPoint {
  day: number;
  score: number;
  phase: string;
}

export function WealthProjectionChart({ currentScore }: WealthProjectionChartProps) {
  const projectionData = useMemo(() => {
    const data: ProjectionDataPoint[] = [];
    const initialScore = Math.max(10, Math.min(20, currentScore));
    let prevScore = initialScore;

    const calculateScoreWithVariation = (baseScore: number, day: number, variation: number = 0.1) => {
      if (day <= 10) {
        const dipFactor = Math.sin(day * 0.05) * variation;
        return Math.max(baseScore + dipFactor, baseScore - 0.2);
      } else {
        const dipFactor = Math.sin(day * 0.03) * (variation * 0.5);
        return Math.max(baseScore + dipFactor, baseScore - 0.1);
      }
    };

    const capScore = (score: number, prevScore: number, day: number) => {
      const maxScore = 70;
      const cappedScore = Math.min(maxScore, Math.max(score, initialScore));
      
      if (day <= 10) {
        return cappedScore;
      } else {
        const maxDailyChange = 0.8;
        const change = cappedScore - prevScore;
        const limitedChange = Math.max(Math.min(change, maxDailyChange), -maxDailyChange);
        return prevScore + limitedChange;
      }
    };

    // Day 0 (Starting point)
    data.push({ day: 0, score: initialScore, phase: "Start" });

    // Phase 1 (Days 1-10): Quick Gains
    const phase1MaxGain = initialScore * 0.8;
    const phase1Duration = 10;
    
    for (let day = 1; day <= phase1Duration; day++) {
      const progress = Math.pow(day / phase1Duration, 0.85);
      let dailyProgress = phase1MaxGain * progress;
      
      const newScore = initialScore + dailyProgress;
      prevScore = capScore(newScore, prevScore, day);
      
      data.push({ 
        day, 
        score: Math.round(calculateScoreWithVariation(prevScore, day, 0.1)),
        phase: "Quick Win" 
      });
    }

    // Phase 2 (Days 11-30): Steady Growth
    const phase2StartScore = prevScore;
    const phase2Duration = 20;
    const phase2MaxGain = 8;
    
    for (let day = phase1Duration + 1; day <= phase1Duration + phase2Duration; day++) {
      const dayInPhase = day - phase1Duration;
      const progressRatio = dayInPhase / phase2Duration;
      const baseProgress = phase2StartScore + (phase2MaxGain * (1 - Math.pow(1 - progressRatio, 3)));
      
      prevScore = capScore(baseProgress, prevScore, day);
      const smoothedScore = calculateScoreWithVariation(prevScore, day, 0.08);
      
      data.push({ 
        day, 
        score: Math.round(smoothedScore),
        phase: "Steady Growth" 
      });
    }

    // Phase 3 (Days 31-120): Consistent Growth
    const phase3StartScore = prevScore;
    const phase3Duration = 90;
    const phase3MaxGain = 15;
    
    for (let day = 31; day <= 120; day++) {
      const dayProgress = (day - 30) / phase3Duration;
      const baseProgress = phase3StartScore + (phase3MaxGain * Math.pow(dayProgress, 0.95));
      
      prevScore = capScore(baseProgress, prevScore, day);
      const smoothedScore = calculateScoreWithVariation(prevScore, day, 0.06);
      
      data.push({ 
        day, 
        score: Math.round(smoothedScore),
        phase: "Consistent Growth" 
      });
    }

    // Phase 4 (Days 121-180): Sustained Growth
    const phase4StartScore = prevScore;
    const phase4Duration = 60;
    const phase4BaseGain = 8;
    const phase4Accelerations = [
      { start: 135, end: 150, multiplier: 1.1 },
      { start: 160, end: 175, multiplier: 1.15 }
    ];
    
    for (let day = 121; day <= 180; day++) {
      const dayProgress = (day - 120) / phase4Duration;
      let baseProgress = phase4StartScore + (phase4BaseGain * (1 - Math.pow(1 - dayProgress, 2)));
      
      const activeAcceleration = phase4Accelerations.find(
        a => day >= a.start && day <= a.end
      );
      
      if (activeAcceleration) {
        const accelerationProgress = (day - activeAcceleration.start) / 
          (activeAcceleration.end - activeAcceleration.start);
        const accelerationMultiplier = 1 + ((1 - Math.cos(accelerationProgress * Math.PI)) * 0.3 * 
          (activeAcceleration.multiplier - 1));
        baseProgress *= accelerationMultiplier;
      }
      
      prevScore = capScore(baseProgress, prevScore, day);
      const smoothedScore = calculateScoreWithVariation(prevScore, day, 0.05);
      
      data.push({ 
        day, 
        score: Math.round(smoothedScore),
        phase: "Breakthrough" 
      });
    }

    return data;
  }, [currentScore]);

  const milestones = [
    { day: 10, label: "Quick Win\nBreakthrough" },
    { day: 45, label: "Strategic\nInsight" },
    { day: 100, label: "Major\nBreakthrough" },
    { day: 140, label: "Peak\nAcceleration" },
    { day: 170, label: "Final\nSurge" },
  ];

  return (
    <Card className="p-6 mt-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 backdrop-blur-sm border-primary/20 shadow-glow">
      <h3 className="text-2xl font-bold mb-4 text-white animate-glow">Your Wealth Score Progress Prediction</h3>
      <div className="h-[300px] sm:h-[400px] relative">
        <div className="absolute inset-0 bg-[url('/images/neural-pattern.png')] bg-cover opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-pink-500 to-transparent opacity-20 blur-xl animate-pulse" />
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={projectionData} 
            margin={{ 
              top: 20, 
              right: 10, 
              left: 0, 
              bottom: 20 
            }}
          >
            <defs>
              <linearGradient id="wealthLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(210, 100%, 60%)" />
                <stop offset="100%" stopColor="hsl(210, 100%, 40%)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 25% 15%)" />
            <XAxis 
              dataKey="day"
              tickFormatter={(day) => `Day ${day}`}
              interval={window.innerWidth < 640 ? 60 : 30}
              stroke="hsl(210 40% 98% / 0.5)"
              tick={{ 
                fill: "hsl(210 40% 98% / 0.5)",
                fontSize: window.innerWidth < 640 ? 10 : 12
              }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="hsl(210 40% 98% / 0.5)"
              tick={{ 
                fill: "hsl(210 40% 98% / 0.5)",
                fontSize: window.innerWidth < 640 ? 10 : 12
              }}
              width={25}
            />
            <Tooltip
              cursor={{ strokeWidth: 2 }}
              wrapperStyle={{ 
                outline: "none",
                touchAction: "none"
              }}
              formatter={(value: number) => Math.round(value)}
              labelFormatter={(day) => `Day ${day}`}
              contentStyle={{
                backgroundColor: "hsl(230 25% 12%)",
                border: "1px solid hsl(210 100% 50% / 0.2)",
                borderRadius: "6px",
                color: "hsl(210 40% 98%)"
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#wealthLine)"
              strokeWidth={3}
              dot={false}
            />
            {milestones.map(({ day, label }) => (
              <ReferenceDot
                key={day}
                x={day}
                y={projectionData.find((d) => d.day === day)?.score || 0}
                r={6}
                fill="hsl(220, 80%, 70%)"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-white/70 mt-4 text-center animate-pulse">
        Results vary. Most successful users maintain consistent daily activation for 6+ months to achieve maximum alignment.
      </p>
    </Card>
  );
}

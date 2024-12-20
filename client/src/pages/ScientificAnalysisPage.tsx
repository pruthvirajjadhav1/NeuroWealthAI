import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useMemo } from "react";
import type { Session } from "@db/schema";

interface SessionResponse {
  sessions: Array<{
    id: string;
    createdAt: string;
    wealthScore: number;
    wealthReading?: string;
    gammaSessionCompleted?: boolean;
  }>;
  todaySessionExists: boolean;
  nextRecordingTime: string;
  currentDayNumber: number;
}

interface BrainwaveRange {
  name: string;
  min: number;
  max: number;
  color: string;
  description: string;
}

export default function ScientificAnalysisPage() {
  const { user } = useUser();

  // Fetch user's latest wealth score data
  const { data: sessionData } = useQuery<SessionResponse>({
    queryKey: ["/api/sessions"],
    enabled: !!user,
  });

  const latestScore = sessionData?.sessions?.[0]?.wealthScore ?? 50;
  
  // Generate visualization data based on wealth score
  const brainwaveRanges: BrainwaveRange[] = [
    { name: 'Delta', min: 0.5, max: 4, color: '#c084fc', description: 'Deep sleep & healing' },
    { name: 'Theta', min: 4, max: 8, color: '#818cf8', description: 'Deep meditation & intuition' },
    { name: 'Alpha', min: 8, max: 12, color: '#c084fc', description: 'Relaxed awareness state' },
    { name: 'Beta', min: 12, max: 38, color: '#60a5fa', description: 'Active thinking & decision making' },
    { name: 'Gamma', min: 38, max: 42, color: '#f97316', description: 'Optimal wealth generation range' },
  ];

  const getBrainwaveType = (freq: number): string => {
    const range = brainwaveRanges.find(r => freq >= r.min && freq <= r.max);
    return range ? range.name : '';
  };

  interface DataPoint {
    frequency: number;
    optimal: number;
    current: number;
    waveType: string;
  }

  const brainwaveData = useMemo<DataPoint[]>(() => {
    const dataPoints: DataPoint[] = [];
    
    // Generate data points across frequency spectrum (0.5-42 Hz)
    for (let freq = 0.5; freq <= 42; freq += 0.5) {
      const optimalAmplitude = getOptimalAmplitude(freq);
      const userAmplitude = getUserAmplitude(freq, latestScore, optimalAmplitude);
      const waveType = getBrainwaveType(freq);
      
      dataPoints.push({
        frequency: freq,
        optimal: optimalAmplitude,
        current: userAmplitude,
        waveType,
      });
    }
    
    return dataPoints;
  }, [latestScore]);

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 sm:pt-28">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Neural Oscillation Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time comparison of your neural patterns with wealth-optimized frequencies
          </p>
        </div>

        <Card className="border-cyan-700/50 bg-black/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-cyan-300">Brainwave Pattern Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] w-full bg-black/60 rounded-lg p-2 sm:p-4 relative overflow-hidden border border-cyan-900/30">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={brainwaveData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  {brainwaveRanges.map((range) => (
                    <ReferenceArea
                      key={range.name}
                      x1={range.min}
                      x2={range.max}
                      fill={range.color}
                      fillOpacity={0.15}
                      stroke={range.color}
                      strokeOpacity={0.3}
                      strokeWidth={1}
                    />
                  ))}
                  <XAxis 
                    dataKey="frequency" 
                    label={{ 
                      value: 'Frequency (Hz)', 
                      position: 'bottom', 
                      fill: '#94a3b8',
                      offset: 0,
                      dy: 25
                    }}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Amplitude', 
                      angle: -90, 
                      position: 'insideLeft', 
                      fill: '#94a3b8',
                      offset: 10,
                      dx: -10
                    }}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(2)}`,
                      `${name} (${props.payload.waveType} wave)`
                    ]}
                    labelFormatter={(freq) => `Frequency: ${freq} Hz`}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="optimal" 
                    stroke="#fbbf24" 
                    strokeWidth={2}
                    dot={false}
                    name="Optimal Pattern"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="current" 
                    stroke="#22d3ee" 
                    strokeWidth={2}
                    dot={false}
                    name="Your Pattern"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                {brainwaveRanges.map((range) => (
                  <div key={range.name} className="p-4 rounded-lg bg-black/40 border border-cyan-900/30">
                    <h3 className="text-sm font-medium" style={{ color: range.color }}>
                      {range.name} ({range.min}-{range.max} Hz)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{range.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-900/30">
                <h3 className="text-sm font-medium text-cyan-300 mb-2">Understanding Your Results</h3>
                <p className="text-sm text-muted-foreground">
                  This visualization compares your current neural oscillation patterns (shown in blue) 
                  with optimal wealth-generating patterns (shown in gold). The closer your patterns 
                  match the optimal range, particularly in the crucial 38-42 Hz gamma frequency band, 
                  the stronger your wealth manifestation potential.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions for generating visualization data
function getOptimalAmplitude(freq: number): number {
  // Fixed optimal amplitudes for each frequency band
  if (freq >= 38 && freq <= 42) {
    return 1.0; // Gamma range - highest amplitude
  } else if (freq >= 12 && freq < 38) {
    return 0.8; // Beta range
  } else if (freq >= 8 && freq < 12) {
    return 0.6; // Alpha range
  } else if (freq >= 4 && freq < 8) {
    return 0.4; // Theta range
  } else {
    return 0.3; // Delta range
  }
}

function getUserAmplitude(freq: number, wealthScore: number, optimalAmplitude: number): number {
  // Direct correlation between wealth score and optimal pattern
  const alignment = wealthScore / 100; // Convert score to 0-1 range
  // Linear interpolation between 30% and 100% of optimal amplitude based on wealth score
  const amplitude = optimalAmplitude * (0.3 + (0.7 * alignment));
  return Math.max(0, Math.min(1, amplitude));
}
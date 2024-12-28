import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { useMemo } from "react";
import type { Session } from "@db/schema";
import ScientificAnalysis from "@/components/ScientificAnalysis";

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
  const { data: sessionData, isLoading } = useQuery<SessionResponse>({
    queryKey: ["/api/sessions"],
    enabled: !!user,
  });

  const abortController = new AbortController();

  // Function to simulate async requests
  const fetchData = async () => {
    try {
      const response = await fetch("/api/data", {
        signal: abortController.signal,
      });
      const data = await response.json();
      console.log(data);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error(err);
      }
    }
  };

  // Display a loading indicator while fetching data

  // Check if the user has completed a session
  const hasCompletedSession = sessionData?.sessions?.length > 0;
  if (!hasCompletedSession && !sessionData?.todaySessionExists) {
    abortController.abort();
    fetchData();
    return (
      <div className="container mx-auto px-4 pt-24 pb-8 sm:pt-28">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Neural Oscillation Analysis
        </h1>
        <p className="text-center text-muted-foreground mt-4">
          Please complete your first voice analysis to unlock the Scientific
          Analysis tab.
        </p>
      </div>
    );
  }

  return (
    <>
      <ScientificAnalysis />
    </>
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

function getUserAmplitude(
  freq: number,
  wealthScore: number,
  optimalAmplitude: number
): number {
  // Direct correlation between wealth score and optimal pattern
  const alignment = wealthScore / 100; // Convert score to 0-1 range
  // Linear interpolation between 30% and 100% of optimal amplitude based on wealth score
  const amplitude = optimalAmplitude * (0.3 + 0.7 * alignment);
  return Math.max(0, Math.min(1, amplitude));
}

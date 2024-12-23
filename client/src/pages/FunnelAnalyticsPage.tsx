import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FunnelStep {
  id: string;
  name: string;
  value: number;
  description: string;
  conversionRate: number;
}

interface UserEvent {
  userId: string;
  eventType: string;
  timestamp: string;
    eventData?: string; // New field

}

interface FunnelData {
  lastUpdated: string;
  timeframe: '1d' | '7d' | '30d' | 'custom';
  startDate: string;
  endDate: string;
  steps: FunnelStep[];
  userEvents: UserEvent[];  // Added field for user events (e.g., registration, upgrade)
}

const FunnelAnalyticsPage = () => {
  const { user } = useUser();
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined
  });

  useEffect(() => {
    // Remove redirect and only fetch if user is admin
    if (user?.isAdmin) {
      fetchFunnelData();
    }
  }, [user, timeframe, dateRange]);

  const fetchFunnelData = async () => {
    try {
      setIsLoading(true);
      let url = `/api/admin/funnel?timeframe=${timeframe}`;
      
      if (timeframe === 'custom' && dateRange.start && dateRange.end) {
        url += `&startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      }

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch funnel data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`funnel data is ${JSON.stringify(funnelData)}`);
      setFunnelData(data);
    } catch (error) {
      console.error("Error fetching funnel data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Early return if not admin, but don't redirect
  if (!user?.isAdmin) {
    return null;
  }

  const calculateConversionRate = (current: number, previous: number): string => {
    if (previous === 0) return "0%";
    return `${((current / previous) * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Marketing Funnel Analytics</h1>
        <div className="flex gap-4 items-center">
          <select
            className="bg-background text-foreground border border-primary/20 rounded px-3 py-2"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeframe === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                className="bg-background text-foreground border border-primary/20 rounded px-3 py-2"
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  start: e.target.value ? new Date(e.target.value) : undefined
                }))}
              />
              <input
                type="date"
                className="bg-background text-foreground border border-primary/20 rounded px-3 py-2"
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  end: e.target.value ? new Date(e.target.value) : undefined
                }))}
              />
            </div>
          )}

          <Button onClick={fetchFunnelData} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Track user progression through the marketing funnel stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData && (
              <div className="space-y-4">
                

               <div className="grid gap-4">
  {funnelData?.steps?.map((step, index) => (
    <Card key={step.name}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{step.name}</h3>
            <p className="text-sm text-muted-foreground">{step.value} users</p>
            <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
          </div>
          {index > 0 && (
            <div className="text-right">
              <p className="text-sm font-medium">Conversion from previous step</p>
              <p className="text-lg font-bold text-primary">
                {calculateConversionRate(
                  step.value,
                  funnelData.steps[index - 1]?.value || 0
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ))}
</div>


                {/* User Events Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tracked User Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {funnelData?.userEvents && funnelData.userEvents.length > 0 ? (
  <div className="overflow-x-auto">
    <table className="min-w-full table-auto">
      <thead>
        <tr>
          <th className="px-4 py-2">User ID</th>
          <th className="px-4 py-2">Event</th>
          <th className="px-4 py-2">Timestamp</th>
          <th className="px-4 py-2">EventData</th>

        </tr>
      </thead>
      <tbody>
        {funnelData.userEvents.map((event) => (
          <tr key={event.userId}>
            <td className="border px-4 py-2">{event.userId}</td>
            <td className="border px-4 py-2">{event.eventType}</td>
            <td className="border px-4 py-2">{event.timestamp}</td>
            <td className="border px-4 py-2">{event.eventData || "N/A"}</td> {/* Display data */}

          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <p>No user events found.</p>
)}

                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FunnelAnalyticsPage;

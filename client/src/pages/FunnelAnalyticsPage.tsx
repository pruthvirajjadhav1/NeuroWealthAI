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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FunnelStep {
  id: string;
  name: string;
  value: number;
  description: string;
  conversionRate: number;
}

interface FunnelData {
  lastUpdated: string;
  timeframe: "1d" | "7d" | "30d" | "custom";
  startDate: string;
  endDate: string;
  steps: FunnelStep[];
}

interface FunnelData2 {
  lastUpdated: string;
  timeframe: "1d" | "7d" | "30d" | "custom";
  startDate: string;
  endDate: string;
  steps?: FunnelStep[];
  free?: number;
  paid?: number;
  trial?: number;
  userEvents?: any[];
}

const FunnelAnalyticsPage: React.FC = () => {
  const { user } = useUser();
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [funnelData2, setFunnelData2] = useState<FunnelData2 | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRegistered, setUserRegistered] = useState<number>(0);
  const [timeframe, setTimeframe] = useState<"1d" | "7d" | "30d" | "custom">(
    "30d"
  );
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });

  useEffect(() => {
    if (user?.isAdmin) {
      fetchFunnelData();
      fetchFunnelData2();
    }
  }, [user, timeframe, dateRange]);

  const fetchFunnelData = async () => {
    try {
      setIsLoading(true);
      let url = `/api/admin/funnel?timeframe=${timeframe}`;

      if (timeframe === "custom" && dateRange.start && dateRange.end) {
        url += `&startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      }

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch funnel data: ${response.statusText}`);
      }

      const data = await response.json();

      const analytics = data.analytics || {};
      // const userRegisteredValue = analytics["user_registered"] || 0;
      // setUserRegistered(userRegisteredValue);

      const importantKeys = [
        "quiz_start",
        "intro_complete",
        "page_view",
        "registration_token_generated",
        // "user_registered",
      ];

      const steps = importantKeys.map((key, index) => {
        const stepValue = analytics[key] || 0;
        return {
          id: (index + 1).toString(),
          name: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          value: stepValue,
          description: `${stepValue} users completed ${key.replace(/_/g, " ")}`,
        };
      });

      steps.forEach((step, index) => {
        if (index > 0) {
          step.conversionRate =
            (step.value / steps[index - 1].value) * 100 || 0;
        }
      });

      setFunnelData({
        lastUpdated: new Date().toISOString(),
        timeframe,
        startDate: dateRange.start?.toISOString() || "",
        endDate: dateRange.end?.toISOString() || "",
        steps,
      });
    } catch (error) {
      console.error("Error fetching funnel data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFunnelData2 = async () => {
    try {
      let url = `/api/admin/funnel2?timeframe=${timeframe}`;

      if (timeframe === "custom" && dateRange.start && dateRange.end) {
        url += `&startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      }

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch funnel data 2: ${response.statusText}`
        );
      }

      const data = await response.json();
      const analytics = data.analytics || {};
      const userRegisteredValue = analytics["total"] || 0;
      setUserRegistered(userRegisteredValue);
      const importantKeys = ["total", "free", "trial", "paid"];

      const steps = importantKeys.map((key, index) => {
        const stepValue = analytics[key] || 0;
        return {
          id: (index + 1).toString(),
          name: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          value: stepValue,
          description: `${stepValue} Total ${key.replace(
            /_/g,
            " "
          )} Registration from Intro`,
        };
      });

      steps.forEach((step, index) => {
        if (index > 0) {
          step.conversionRate =
            (step.value / steps[index - 1].value) * 100 || 0;
        }
      });

      setFunnelData2({
        lastUpdated: new Date().toISOString(),
        timeframe,
        startDate: dateRange.start?.toISOString() || "",
        endDate: dateRange.end?.toISOString() || "",
        free: analytics.free || 0,
        paid: analytics.paid || 0,
        trial: analytics.trial || 0,
        steps,
      });
    } catch (error) {
      console.error("Error fetching funnel data 2:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateConversionRate = (
    current: number,
    previous: number
  ): string => {
    if (previous === 0) return "0%";
    return `${((current / previous) * 100).toFixed(1)}%`;
  };

  if (!user?.isAdmin) {
    return null;
  }

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
        <h1 className="text-2xl font-bold text-foreground">
          Marketing Funnel Analytics
        </h1>
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

          {timeframe === "custom" && (
            <div className="flex gap-2">
              <input
                type="date"
                className="bg-background text-foreground border border-primary/20 rounded px-3 py-2"
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    start: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  }))
                }
              />
              <input
                type="date"
                className="bg-background text-foreground border border-primary/20 rounded px-3 py-2"
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    end: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
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
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={funnelData.steps}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "Users"
                            ? `${value} users`
                            : `${value.toFixed(1)}%`,
                          name,
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        name="Users"
                        dataKey="value"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        name="Conversion Rate"
                        dataKey="conversionRate"
                        stroke="#10b981"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-4">
                  {funnelData.steps.map((step, index) => (
                    <Card key={step.name}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{step.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {step.value} users
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {step.description}
                            </p>
                          </div>
                          {index > 0 && (
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                Conversion from previous step
                              </p>
                              <p className="text-lg font-bold text-primary">
                                {calculateConversionRate(
                                  step.value,
                                  funnelData.steps[index - 1].value
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {funnelData2 && funnelData2.steps && (
                  <div className="grid gap-4">
                    {funnelData2.steps.map((step, index) => (
                      <Card key={step.name}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{step.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {step.value} users
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {step.description}
                              </p>
                            </div>
                            {index > 0 && (
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  Registered Users Conversion From Total to{" "}
                                  {step.name}
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  {(
                                    (step.value / userRegistered) * 100 || 0
                                  ).toFixed(2)}
                                  %
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FunnelAnalyticsPage;

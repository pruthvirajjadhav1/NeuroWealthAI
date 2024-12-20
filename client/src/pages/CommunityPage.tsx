import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";

interface CommunityStats {
  onlineUsers: number;
  totalUsers: number;
  avgImprovement: number;
  lastUpdated: string;
}

interface SuccessStory {
  userSegment: string;
  story: string;
  improvement: number;
  timeframe: number;
  createdAt: string;
}

export default function CommunityPage() {
  // Fetch community stats
  const { data: stats } = useQuery<CommunityStats>({
    queryKey: ["/api/community/stats"],
    queryFn: async () => {
      const response = await fetch("/api/community/stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch community stats");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch success stories
  const { data: successStories } = useQuery<SuccessStory[]>({
    queryKey: ["/api/community/success-stories"],
    queryFn: async () => {
      const response = await fetch("/api/community/success-stories", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch success stories");
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">NeuroWealth Community</h1>

      {/* Community Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Users Online Now</p>
              <p className="text-2xl font-bold">{stats?.onlineUsers || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Average Improvement</p>
              <p className="text-2xl font-bold">+{stats?.avgImprovement || 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Community</p>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        {/* Success Stories */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Success Stories</h2>
          <div className="space-y-4">
            {successStories?.map((story, index) => (
              <Card key={index} className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-primary font-medium">
                      {story.userSegment}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {story.timeframe} days
                    </p>
                  </div>
                  <p className="text-sm">{story.story}</p>
                  <p className="text-sm font-medium text-primary">
                    +{story.improvement}% improvement
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

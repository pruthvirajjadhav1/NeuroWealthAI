import { FrequencyAdvisor } from "@/components/FrequencyAdvisor";
import { useQuery } from "@tanstack/react-query";
import { PremiumFeature } from "@/components/PremiumFeature";

export default function AdvisorPage() {
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
  });

  const { data: sessionData } = useQuery({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  const subscriptionStatus = userData?.subscriptionStatus || 'trial';

  return (
    <PremiumFeature 
      subscriptionStatus={subscriptionStatus}
      sessionCount={sessionData?.sessions?.length}
    >
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Personal Wealth Frequency Advisor</h1>
          </div>
          <div className="mb-6">
            <p className="text-foreground/80 text-base sm:text-lg leading-relaxed">
              Get personalized guidance based on your current wealth frequency patterns
              and specific concerns. Select your primary concern below to receive
              targeted advice.
            </p>
          </div>
          <FrequencyAdvisor />
        </div>
      </main>
    </PremiumFeature>
  );
}

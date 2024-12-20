import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";

interface PremiumFeatureProps {
  subscriptionStatus: string;
  sessionCount?: number;
  children: React.ReactNode;
}

export function PremiumFeature({ 
  subscriptionStatus, 
  sessionCount = 0,
  children 
}: PremiumFeatureProps) {
  const isTrialUser = subscriptionStatus === 'trial';
  const isFreeUser = subscriptionStatus === 'free';
  const isPaidUser = subscriptionStatus === 'paid';

  // Paid feature users see content normally
  if (isPaidUser) {
    return <>{children}</>;
  }

  // Trial users see blurred content with trial message
  // Free users see blurred content with feature-locked message

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 text-center relative">
        {/* Premium/Trial Message Overlay */}
        <div className="relative z-50 mb-6">
          <div className="flex items-center justify-center">
            {isTrialUser ? (
              <Crown className="h-12 w-12 text-yellow-500" />
            ) : (
              <Lock className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {isTrialUser ? 'Neural Calibration in Progress' : 'Advanced Feature'}
            </h2>
            <p className="text-muted-foreground">
              {isTrialUser
                ? "Your Neural Wealth Pattern is currently calibrating. The system requires 7 days of voice data to generate affirmations that perfectly match your unique brain frequency."
                : "This advanced feature requires full access to use our proprietary neural track wealth rewiring system"}
            </p>
            {isTrialUser && sessionCount > 0 && (
              <>
                <Progress value={(sessionCount / 7) * 100} className="bg-primary/10" />
                <p className="text-sm text-muted-foreground">
                  {sessionCount}/7 days completed
                </p>
              </>
            )}
          </div>
          {!isTrialUser && (
            <Button
              variant="outline"
              className="w-full mt-4 border-primary/20 hover:bg-primary/5"
              onClick={() => window.location.href = '/trial'}
            >
              Start Trial Access
            </Button>
          )}
        </div>

        {/* Content Container - Blurred and non-interactive for free users */}
        <div className={`${(!isTrialUser && !isPaidUser) 
          ? 'blur-sm filter pointer-events-none select-none' 
          : ''} 
          bg-muted/50 p-4 rounded-lg relative`}
        >
          {children}
        </div>
      </Card>
    </div>
  );
}
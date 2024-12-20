import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

export default function TrialPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center">
          <Crown className="h-12 w-12 text-yellow-500" />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Unlock Your Wealth Potential</h1>
          <p className="text-muted-foreground">
            Start your 7-day trial and experience the full power of NeuroWealth AI.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => window.location.href = 'https://neurowealth.ai'}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Start Free Trial
          </Button>
        </div>
      </Card>
    </div>
  );
}
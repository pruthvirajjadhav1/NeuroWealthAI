import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useLocation } from "wouter";

export default function TrialSuccessPage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center">
          <Crown className="h-12 w-12 text-yellow-500" />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Trial Activated</h1>
          <p className="text-muted-foreground">
            Thank you for starting your 7-day trial with NeuroWealth AI.
          </p>
            <Button onClick={() => setLocation("/")} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">Continue to App</Button>
        </div>

      </Card>
    </div>
  );
}
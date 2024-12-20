import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function TrialSuccessPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const activateTrial = async () => {
    try {
      const response = await fetch('/api/update-subscription-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'trial' })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your trial access has been activated!",
        });
        setLocation('/');
      } else {
        throw new Error('Failed to activate trial access');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate your trial access. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center">
          <Crown className="h-12 w-12 text-yellow-500" />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to Your Trial Access!</h1>
          <p className="text-muted-foreground">
            Click below to activate your 7-day trial and unlock all advanced features of our neural wealth system.
          </p>

          <Button 
            onClick={activateTrial}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Start My Trial Access
          </Button>
        </div>
      </Card>
    </div>
  );
}
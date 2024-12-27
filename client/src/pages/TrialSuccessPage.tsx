import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function TrialSuccessPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/verify-session/${sessionId}`);
        const data = await response.json();
        console.log("VERIFY DATA", data)
        if (data.paid) {
          setIsVerified(true);
        } else {
          toast({
            title: "Payment Pending",
            description: "Your payment is still being processed. Please try again in a moment.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Verification Failed",
          description: "Unable to verify your subscription. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            <p className="text-muted-foreground">Verifying your subscription...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-500">Verification Failed</h1>
            <p className="text-muted-foreground">
              We couldn't verify your subscription. Please try again or contact support.
            </p>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
            >
              Return Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center">
          <Crown className="h-12 w-12 text-yellow-500" />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to Your Trial Access!</h1>
        </div>
      </Card>
    </div>
  );
}
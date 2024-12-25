import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function TrialPage() {
  const [isLoading, setIsLoading] = useState(false);

    const handleStartTrial = async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          credentials: 'include'
      });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to create checkout session")
        }
        const data = await response.json();
        if(data.url){
           window.location.href = data.url
        } else{
            throw new Error('No url was provided by the server to redirect');
        }

    } catch (error) {
      console.error("Error creating checkout session:", error);
     // Display an error message to the user
      // Handle error, such as showing a message or setting an error state
    } finally{
       setIsLoading(false)
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Unlock Your Wealth Potential</h1>
          <p className="text-muted-foreground">
            Start your 7-day trial and experience the full power of NeuroWealth AI.
          </p>
          <p className="text-muted-foreground">
             You will be charged $0.50 for the first 7 days, then $29.99 every month after
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleStartTrial}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
            disabled={isLoading}
          >
              {isLoading? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading... </>):'Start Free Trial' }
          </Button>
        </div>
      </Card>
    </div>
  );
}
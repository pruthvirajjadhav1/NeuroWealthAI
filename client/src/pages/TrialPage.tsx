import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { loadStripe } from '@stripe/stripe-js';
import * as dotenv from 'dotenv';
dotenv.config();

const TrialPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  console.log('Stripe key:', process.env.STRIPE_KEY_FRONTEND);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          userId: user?.id,
        }),
      });

      const { sessionId } = await response.json();

      if (sessionId) {
        const stripe = await loadStripe(process.env.STRIPE_KEY_FRONTEND as string);
        const result = await stripe?.redirectToCheckout({ sessionId });
        if (result?.error) {
          console.error('Stripe Checkout error:', result.error.message);
        }
      } else {
        console.error('Error: Could not create session or redirect');
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Unlock Your Wealth Potential</h1>
        <p className="text-muted-foreground">
          Start your 7-day trial for just <strong>$0.50</strong> and experience the full power of NeuroWealth AI.
        </p>
      </div>
      <Button
        onClick={handleCheckout}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Start Free Trial"}
      </Button>
    </div>
  );
};

export default TrialPage;

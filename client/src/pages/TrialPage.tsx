import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card } from "@/components/ui/card";
import { Crown } from "lucide-react";
import PaymentCheckoutForm from './PaymentCheckoutForm';

// if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
//   throw new Error("Stripe publishable key is not defined in .env");
// }
const stripePromise = loadStripe("pk_test_51QaZDFDLDmCdDSpqxUExi9n0KfcZGOjJ5GNgbwTvM2oLnZ0jX22qonCXwvhjN3Ew88HlN0mDpQzFe25SkqhMFeQp00MWyWwlZD");

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
        <Elements stripe={stripePromise}>
          <PaymentCheckoutForm />
        </Elements>
      </Card>
    </div>
  );
}
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";

export default function PaymentCheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
  
    const handlePayment = async () => {
      if (!stripe || !elements) {
        return;
      }
  
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'GET',
        });
  
        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }
  
        const { sessionId } = await response.json();
  
        const { error } = await stripe.redirectToCheckout({ sessionId });
  
        if (error) {
          console.error('Error redirecting to Checkout:', error.message);
        }
      } catch (error) {
        console.error('Error creating Checkout session:', error);
      }
    };
  
    return (
      <div>
        <div className="space-y-4">
          <Button
            onClick={handlePayment}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    );
  };
  
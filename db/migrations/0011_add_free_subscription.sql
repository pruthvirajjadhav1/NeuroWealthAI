-- Add support for 'free' subscription status
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_subscription_status_check";
ALTER TABLE "users" ADD CONSTRAINT "users_subscription_status_check" 
  CHECK (subscription_status IN ('paid', 'trial', 'churned', 'free'));

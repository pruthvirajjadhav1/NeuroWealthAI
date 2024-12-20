-- Add subscription_status column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_status" text DEFAULT 'paid' CHECK ("subscription_status" IN ('paid', 'trial', 'churned')) NOT NULL;

-- Backfill existing users to have 'paid' status
UPDATE "users" SET "subscription_status" = 'paid' WHERE "subscription_status" IS NULL;

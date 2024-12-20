-- Add subscription_type column to registration_tokens
ALTER TABLE "registration_tokens" ADD COLUMN IF NOT EXISTS "subscription_type" text DEFAULT 'paid' NOT NULL;

-- Set default value for existing rows
UPDATE "registration_tokens" SET "subscription_type" = 'paid' WHERE "subscription_type" IS NULL;

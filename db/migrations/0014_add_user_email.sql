-- Add email column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;

-- Create a unique index on email to prevent duplicates while allowing nulls
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email") WHERE "email" IS NOT NULL;

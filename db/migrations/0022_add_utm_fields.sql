-- Add UTM tracking fields to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "utm_source" text,
ADD COLUMN IF NOT EXISTS "utm_adid" text,
ADD COLUMN IF NOT EXISTS "utm_angle" text,
ADD COLUMN IF NOT EXISTS "utm_funnel" text;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_utm_source ON users(utm_source);
CREATE INDEX IF NOT EXISTS idx_users_utm_adid ON users(utm_adid);

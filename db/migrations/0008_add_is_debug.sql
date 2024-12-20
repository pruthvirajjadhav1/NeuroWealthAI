-- Add is_debug column to users table with default false
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_debug" boolean DEFAULT false;

-- Set is_debug to true for admin user and false for all others
UPDATE "users" SET "is_debug" = CASE 
    WHEN username = 'admin' THEN true 
    ELSE false 
END;

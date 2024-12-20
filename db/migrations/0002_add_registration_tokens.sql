-- Add is_admin column to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false;

-- Create registration tokens table
CREATE TABLE "registration_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_by" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "used_at" timestamp,
  "used_by" integer REFERENCES "users"("id"),
  "is_active" boolean DEFAULT true NOT NULL,
  "parameters" jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Create first admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
    INSERT INTO users (username, password, is_admin) 
    VALUES ('admin', 'change_this_password', true);
  END IF;
END
$$;

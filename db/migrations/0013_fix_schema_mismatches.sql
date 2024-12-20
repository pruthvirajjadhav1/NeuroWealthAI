-- Fix dailyAffirmations type to match schema.ts
ALTER TABLE "sessions" 
    ALTER COLUMN "dailyAffirmations" TYPE text;

--> statement-breakpoint
-- Add missing indices for better query performance
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions" ("userId");
CREATE INDEX IF NOT EXISTS "sessions_createdAt_idx" ON "sessions" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "sessions_userId_createdAt_idx" ON "sessions" ("userId", "createdAt" DESC);

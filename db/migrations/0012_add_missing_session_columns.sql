ALTER TABLE "sessions"
ADD COLUMN IF NOT EXISTS "dailyAffirmations" text,
ADD COLUMN IF NOT EXISTS "affirmationCompleted" boolean DEFAULT false;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions" ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_createdAt_idx" ON "sessions" ("createdAt" DESC);

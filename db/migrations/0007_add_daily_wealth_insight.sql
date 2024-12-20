ALTER TABLE "sessions" ADD COLUMN "dailyWealthInsight" text;
--> statement-breakpoint
CREATE INDEX "sessions_userId_createdAt_idx" ON "sessions" ("userId", "createdAt" DESC);

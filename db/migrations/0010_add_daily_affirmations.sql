ALTER TABLE "sessions" ADD COLUMN "dailyAffirmations" jsonb;
--> statement-breakpoint
CREATE INDEX "sessions_dailyAffirmations_idx" ON "sessions" USING GIN ("dailyAffirmations");

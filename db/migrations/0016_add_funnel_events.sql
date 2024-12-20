CREATE TABLE IF NOT EXISTS "funnel_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "eventType" text NOT NULL,
  "eventData" text,
  "userId" integer REFERENCES "users"("id"),
  "sessionId" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS "funnel_events_event_type_idx" ON "funnel_events" ("eventType");
CREATE INDEX IF NOT EXISTS "funnel_events_created_at_idx" ON "funnel_events" ("createdAt");
CREATE INDEX IF NOT EXISTS "funnel_events_session_id_idx" ON "funnel_events" ("sessionId");

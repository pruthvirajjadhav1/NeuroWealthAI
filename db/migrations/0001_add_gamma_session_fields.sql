ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS "hasGeneratedGammaSession" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "gammaSessionCompletedAt" timestamp;

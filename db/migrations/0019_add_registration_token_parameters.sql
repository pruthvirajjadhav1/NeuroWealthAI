-- Add parameters column to registration_tokens table
ALTER TABLE registration_tokens 
ADD COLUMN IF NOT EXISTS parameters jsonb DEFAULT '{}'::jsonb;

-- Update schema to ensure compatibility
ALTER TABLE users 
ALTER COLUMN is_intro SET DEFAULT false;

-- Initialize existing rows
UPDATE registration_tokens 
SET parameters = '{}'::jsonb 
WHERE parameters IS NULL;

UPDATE users 
SET is_intro = false 
WHERE is_intro IS NULL;

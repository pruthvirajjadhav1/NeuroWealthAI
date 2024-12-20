-- Add is_intro column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_intro boolean DEFAULT false;

-- Update existing users from intro flow tokens
UPDATE users u 
SET is_intro = true 
WHERE EXISTS (
  SELECT 1 FROM registration_tokens rt 
  WHERE rt.used_by = u.id 
  AND rt.parameters->>'is_intro' = 'true'
);

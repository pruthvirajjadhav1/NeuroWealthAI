-- Set default value for is_intro to false for all users where it's NULL
UPDATE users 
SET is_intro = false 
WHERE is_intro IS NULL;

-- Ensure is_intro has a default value of false
ALTER TABLE users 
ALTER COLUMN is_intro SET DEFAULT false;

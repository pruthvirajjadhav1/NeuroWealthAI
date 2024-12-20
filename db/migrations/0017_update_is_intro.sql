
-- Update is_intro to false for all users except the latest one
WITH latest_user AS (
  SELECT id 
  FROM users 
  ORDER BY created_at DESC 
  LIMIT 1
)
UPDATE users 
SET is_intro = false 
WHERE id NOT IN (SELECT id FROM latest_user);

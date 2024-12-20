-- Create utm_tracking table
CREATE TABLE IF NOT EXISTS utm_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  source VARCHAR(255),
  adid VARCHAR(255),
  angle VARCHAR(255),
  funnel VARCHAR(255),
  -- Additional fields for tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  raw_params JSONB, -- Store all UTM parameters for future extensibility
  
  -- Add index for faster lookups
  CONSTRAINT utm_tracking_user_id_unique UNIQUE (user_id)
);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_utm_tracking_source ON utm_tracking(source);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_created_at ON utm_tracking(created_at);

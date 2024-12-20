CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  first_access_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_access_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  last_wealth_score INTEGER,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  wealth_dna_prediction TEXT,
  last_action_guide TEXT,
  last_expert_opinion TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "neuralScore" INTEGER,
  "wealthScore" INTEGER NOT NULL,
  "isBaseline" BOOLEAN DEFAULT FALSE,
  "audioUrl" TEXT,
  "audioData" TEXT,
  "gammaSessionCompleted" BOOLEAN DEFAULT FALSE,
  "gammaSessionGeneratedAt" TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  "wealthReading" TEXT,
  "wealthReadingExpiresAt" TIMESTAMP WITH TIME ZONE,
  "expertOpinion" TEXT,
  "wealthFrequency" TEXT,
  "actionGuide" TEXT,
  "improvementPercentage" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

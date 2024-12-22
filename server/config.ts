
import dotenv from 'dotenv';
dotenv.config();

export const SERVER_CONFIG = {
  host: '0.0.0.0', 
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  gracefulShutdownTimeout: 10000,
  staticPath: process.env.NODE_ENV === 'production' ? './dist/public' : './dist/public'
};

export const DB_CONFIG = {
  url: process.env.DATABASE_URL,
  connectionTimeout: 30000,
  retryAttempts: 3
};

export const AUTH_CONFIG = {
  sessionSecret: process.env.SESSION_SECRET || 'development-secret-key',
  sessionMaxAge: 24 * 60 * 60 * 1000,
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieSameSite: 'lax' as const
};

export const ENV_CONFIG = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

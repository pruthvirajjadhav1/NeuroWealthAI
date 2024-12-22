
import express from "express";
import { createServer } from "http";
import { setupVite } from "./vite";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { SERVER_CONFIG, ENV_CONFIG, DB_CONFIG } from "./config";

const app = express();
const server = createServer(app);

async function initializeDatabase() {
  let retryCount = 0;
  while (retryCount < DB_CONFIG.retryAttempts) {
    try {
      await db.execute(sql`SELECT 1`);
      console.log('Database connected successfully');
      return true;
    } catch (error) {
      retryCount++;
      console.error(`Database connection attempt ${retryCount} failed:`, error);
      if (retryCount < DB_CONFIG.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  }
  return ENV_CONFIG.isDevelopment;
}

async function startServer() {
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));

  setupAuth(app);
  registerRoutes(app);

  if (ENV_CONFIG.isDevelopment) {
    await setupVite(app, server);
  } else {
    app.use(express.static(SERVER_CONFIG.staticPath));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: SERVER_CONFIG.staticPath });
    });
  }

  server.listen(3000, SERVER_CONFIG.host, () => {
    console.log(`Server running on http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
  });

  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Server shut down gracefully');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, SERVER_CONFIG.gracefulShutdownTimeout);
  });
}

(async () => {
  try {
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized && !ENV_CONFIG.isDevelopment) {
      throw new Error('Database initialization failed');
    }
    await startServer();
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
})();

import express from "express";
import { createServer } from "http";
import { setupVite } from "./vite";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { SERVER_CONFIG, ENV_CONFIG, DB_CONFIG } from "./config";
import { registerAdminRoutes } from "./token";
import path from "path";

const app = express();
const server = createServer(app);

async function initializeDatabase() {
  let retryCount = 0;
  while (retryCount < DB_CONFIG.retryAttempts) {
    try {
      await db.execute(sql`SELECT 1`);
      console.log("Database connected successfully");
      return true;
    } catch (error) {
      retryCount++;
      console.error(`Database connection attempt ${retryCount} failed:`, error);
      if (retryCount < DB_CONFIG.retryAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount))
        );
      }
    }
  }
  return ENV_CONFIG.isDevelopment;
}

async function startServer() {
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: false, limit: "50mb" }));

  setupAuth(app);
  registerRoutes(app);
  registerAdminRoutes(app);

  // if (ENV_CONFIG.isDevelopment) {
  //   await setupVite(app, server);
  // } else {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);

    // Use the correct path for the dist directory
    app.use(express.static(path.join(__dirname, '..', 'dist', 'public')));
    
    app.get("*", (_req, res) => {
      // Correct path to index.html
      res.sendFile(path.resolve(__dirname, '..', 'dist', 'public', 'index.html'));
    });
  // }

  server.listen(SERVER_CONFIG, () => {
    console.log(`Server running on http://127.0.0.1:${SERVER_CONFIG.port}`);
  });

  process.on("SIGTERM", () => {
    server.close(() => {
      console.log("Server shut down gracefully");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, SERVER_CONFIG.gracefulShutdownTimeout);
  });
}

(async () => {
  try {
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized && !ENV_CONFIG.isDevelopment) {
      throw new Error("Database initialization failed");
    }
    await startServer();
  } catch (error) {
    console.error("Fatal error during startup:", error);
    process.exit(1);
  }
})();

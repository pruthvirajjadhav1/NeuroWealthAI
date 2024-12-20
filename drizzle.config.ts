import type { Config } from "drizzle-kit";
import * as dotenv from 'dotenv';
dotenv.config();

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL ? {
    host: process.env.PGHOST!,
    user: process.env.PGUSER!,
    password: process.env.PGPASSWORD!,
    database: process.env.PGDATABASE!,
    port: Number(process.env.PGPORT),
    ssl: true
  } : {
    host: "localhost",
    user: "postgres",
    password: "postgres",
    database: "postgres",
    port: 5432
  },
  verbose: true,
  strict: true
} satisfies Config;

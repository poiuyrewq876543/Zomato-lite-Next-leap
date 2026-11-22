import { Pool } from "pg";

/**
 * One pool per server process. Next.js may evaluate this module more than once
 * in development (hot reload), so the pool is cached on globalThis.
 */
const globalForDb = globalThis as unknown as { zomatoLitePool?: Pool };

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }

  if (!globalForDb.zomatoLitePool) {
    globalForDb.zomatoLitePool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return globalForDb.zomatoLitePool;
}

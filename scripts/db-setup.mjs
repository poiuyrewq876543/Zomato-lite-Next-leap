#!/usr/bin/env node
/**
 * Creates the Zomato Lite tables and loads the launch seed data.
 * Usage: npm run db:setup
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadEnvFile(file) {
  let contents;
  try {
    contents = await readFile(path.join(root, file), "utf8");
  } catch {
    return false;
  }

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return true;
}

const loaded = (await loadEnvFile(".env.local")) || (await loadEnvFile(".env"));

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Create .env.local (copy .env.example) and add your Neon connection string.",
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15_000,
});

try {
  await client.connect();
  console.log(`Connected${loaded ? " (env loaded from file)" : ""}.`);

  const schema = await readFile(path.join(root, "db", "schema.sql"), "utf8");
  await client.query(schema);
  console.log("Schema ready: restaurant, review.");

  const seed = await readFile(path.join(root, "db", "seed.sql"), "utf8");
  await client.query(seed);
  console.log("Seed data loaded.");

  const check = await client.query(
    `SELECT r.id, r.name, r.location, r.cuisine, r.type,
            COUNT(v.id)::int AS reviews,
            ROUND(AVG(v.rating)::numeric, 1) AS average
     FROM restaurant r
     LEFT JOIN review v ON v.restaurant_id = r.id
     GROUP BY r.id
     ORDER BY r.id`,
  );

  for (const row of check.rows) {
    console.log(
      `  #${row.id} ${row.name} · ${row.location} · ${row.cuisine} · ${row.type} · ${row.reviews} review(s) · avg ${row.average ?? "none"}`,
    );
  }
} catch (error) {
  console.error("Database setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

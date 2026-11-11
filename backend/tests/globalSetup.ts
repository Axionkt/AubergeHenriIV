import fs from "node:fs/promises";
import path from "node:path";
import { applyTestEnv, assertTestDatabase } from "./env";

/**
 * Runs once per `vitest run`, before any test file: rebuilds the schema
 * from scratch the same way production gets it, i.e. the 000_init.sql
 * baseline followed by the migration runner.
 */
export default async function setup(): Promise<void> {
  applyTestEnv();
  assertTestDatabase();

  // Imported after the env is set: config.ts validates it at import time.
  const { default: pool } = await import("../db");
  const { runMigrations } = await import("../db/migrate");

  try {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    const baseline = await fs.readFile(
      path.resolve(__dirname, "../db/migrations/000_init.sql"),
      "utf8",
    );
    await pool.query(baseline);
    await runMigrations();
  } finally {
    await pool.end();
  }
}

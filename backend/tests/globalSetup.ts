import { applyTestEnv, assertTestDatabase } from "./env";

/**
 * Runs once per `vitest run`, before any test file: rebuilds the schema
 * from an empty database with the migration runner alone (000_init.sql
 * included), the way a new deployment gets it. The upgrade path of an
 * existing production database is covered in migrations.test.ts.
 */
export default async function setup(): Promise<void> {
  applyTestEnv();
  assertTestDatabase();

  // Imported after the env is set: config.ts validates it at import time.
  const { default: pool } = await import("../db");
  const { runMigrations } = await import("../db/migrate");

  try {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await runMigrations();
  } finally {
    await pool.end();
  }
}

import fs from "node:fs/promises";
import path from "node:path";
import pool from "../db";
import { logger } from "../utils/logger";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/migrations");
const LOCK_ID = 12345;

/**
 * Applies every db/migrations/*.sql file not yet recorded in
 * schema_migrations, in filename order, each in its own transaction. An
 * advisory lock keeps two starting instances from migrating at once. Runs
 * before the server listens; any failure aborts startup.
 */
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);

    const { rows } = await client.query<{ name: string }>(
      "SELECT name FROM schema_migrations",
    );
    const done = new Set(rows.map((r) => r.name));

    // Existing database from before migrations: the baseline is already in it.
    if (done.size === 0) {
      const { rows: t } = await client.query(
        "SELECT to_regclass('public.users') AS users",
      );
      if (t[0].users) {
        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ('000_init.sql')",
        );
        done.add("000_init.sql");
      }
    }

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8");

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        logger.info(`[migrate] applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [LOCK_ID])
      .catch(() => {});
    client.release();
  }
}

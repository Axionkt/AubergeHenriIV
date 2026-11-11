import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import pool from "../db";
import { runMigrations } from "../db/migrate";

// The runner executes on every container start, so it must be a no-op on
// an up-to-date database.
describe("migration runner", () => {
  it("records every migration once and is a no-op when re-run", async () => {
    const files = fs
      .readdirSync(path.resolve(__dirname, "../db/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    await runMigrations();
    await runMigrations();

    const { rows } = await pool.query<{ name: string }>(
      "SELECT name FROM schema_migrations ORDER BY name",
    );
    expect(rows.map((r) => r.name)).toEqual(files);
  });
});

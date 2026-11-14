import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import pool from "../db";
import { runMigrations } from "../db/migrate";

const MIGRATIONS_DIR = path.resolve(__dirname, "../db/migrations");
const migrationFiles = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

/** Everything that defines the schema, one sortable line per item. */
const SCHEMA_QUERY = `
  SELECT 'column ' || table_name || '.' || column_name || ' ' || data_type
         || coalesce('(' || character_maximum_length || ')', '')
         || coalesce(' (' || numeric_precision || ',' || numeric_scale || ')', '')
         || ' nullable=' || is_nullable
         || ' default=' || coalesce(column_default, '-') AS item
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name <> 'schema_migrations'
  UNION ALL
  SELECT 'enum ' || t.typname || ' = '
         || string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder)
  FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
  GROUP BY t.typname
  UNION ALL
  SELECT 'index ' || indexdef FROM pg_indexes
  WHERE schemaname = 'public' AND tablename <> 'schema_migrations'
  UNION ALL
  SELECT 'constraint ' || conrelid::regclass || ' ' || conname || ' '
         || pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE connamespace = 'public'::regnamespace
  UNION ALL
  SELECT 'function ' || proname FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
  ORDER BY 1`;

async function schemaOf(db: { query: Client["query"] }): Promise<string[]> {
  const { rows } = await db.query<{ item: string }>(SCHEMA_QUERY);
  return rows.map((r) => r.item);
}

describe("baseline", () => {
  // 000_init.sql is the schema production was built from. Editing it does
  // nothing to existing databases (the runner records it as applied), so
  // schema changes must go in a new numbered migration instead.
  it("000_init.sql is unchanged since production was built from it", () => {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, "000_init.sql"));
    expect(crypto.createHash("sha256").update(sql).digest("hex")).toBe(
      "4fbb629da81f867ca2d98f50870ca00e983f0487848c2a93dc222685136b62bf",
    );
  });
});

describe("migration runner on a new database", () => {
  it("records every migration once and is a no-op when re-run", async () => {
    // globalSetup already migrated this database from empty.
    await runMigrations();

    const { rows } = await pool.query<{ name: string }>(
      "SELECT name FROM schema_migrations ORDER BY name",
    );
    expect(rows.map((r) => r.name)).toEqual(migrationFiles);
  });
});

/**
 * Production predates the runner: its schema came from 000_init.sql alone,
 * with no schema_migrations table. On first start the runner must record
 * that baseline, upgrade both schema and data, and end up exactly where a
 * new database does.
 */
describe("migration runner on a pre-runner production database", () => {
  const legacyDb = `${process.env.DB_NAME}_legacy`;
  let legacy: Client;
  let apartmentId: string;

  beforeAll(async () => {
    await pool.query(`DROP DATABASE IF EXISTS ${legacyDb}`);
    await pool.query(`CREATE DATABASE ${legacyDb}`);
    legacy = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: legacyDb,
    });
    await legacy.connect();

    // The schema as deployed, with data in every legacy shape.
    await legacy.query(
      fs.readFileSync(path.join(MIGRATIONS_DIR, "000_init.sql"), "utf8"),
    );
    const { rows } = await legacy.query<{ id: string }>(
      `INSERT INTO Apartments (name, description, type, size_carrez_sqm, size_floor_sqm,
         floor, orientation, view, electric_heating_model, bathroom_towel_heater_model,
         electric_water_heater_model, induction_cooktop_model, oven_model, range_hood_model,
         kitchen_cabinets_model, dpe_energy_rating, dpe_energy_kwh_per_sqm_year,
         dpe_emissions_rating, dpe_emissions_kg_per_sqm_year,
         previous_tenant_annual_consumption_eur, meter_power_kva, delivery_point_id,
         land_registry_ref_pre_2025, land_registry_ref_post_2025)
       VALUES ('A', 'd', 'T2', 40, 42, '1', 'Sud', 'Jardin', 'h', 't', 'w', 'i', 'o', 'r',
         'k', 'C', 150, 'B', 10, 912.5, 6, '123', 'AB 1', 'AB 2')
       RETURNING id`,
    );
    apartmentId = rows[0].id;
    await legacy.query(
      `INSERT INTO Media (file_path, mime_type, size_bytes, context, context_id, type, is_thumbnail)
       VALUES ('apartment/a/thumb.webp', 'image/webp', 1, 'apartment', $1, 'image', TRUE),
              ('apartment/a/tour.mp4',   'video/mp4',  1, 'apartment', $1, 'video', FALSE),
              ('common-space/hall.webp', 'image/webp', 1, 'common-space', NULL, 'image', FALSE)`,
      [apartmentId],
    );
    await legacy.query(
      `INSERT INTO Users (email, first_name, last_name, email_verification_token)
       VALUES ('Mixed.Case@Example.com', 'A', 'B', 'raw-legacy-token')`,
    );

    // Run the real runner against that database: config.ts reads DB_NAME
    // at import time, so load fresh copies of the modules.
    const testDb = process.env.DB_NAME;
    process.env.DB_NAME = legacyDb;
    vi.resetModules();
    const { runMigrations: runOnLegacy } = await import("../db/migrate");
    const { default: legacyPool } = await import("../db");
    process.env.DB_NAME = testDb;
    try {
      await runOnLegacy();
    } finally {
      await legacyPool.end();
    }
  });

  afterAll(async () => {
    await legacy?.end();
    await pool.query(`DROP DATABASE IF EXISTS ${legacyDb}`);
  });

  it("ends with exactly the schema of a new database", async () => {
    expect(await schemaOf(legacy)).toEqual(await schemaOf(pool));

    const { rows } = await legacy.query<{ name: string }>(
      "SELECT name FROM schema_migrations ORDER BY name",
    );
    expect(rows.map((r) => r.name)).toEqual(migrationFiles);
  });

  it("converts media to roles, uppercase types and per-kind common areas", async () => {
    const { rows } = await legacy.query(
      "SELECT file_path, context, context_id, role, type FROM Media ORDER BY file_path",
    );
    expect(rows).toEqual([
      { file_path: "apartment/a/thumb.webp", context: "apartment", context_id: apartmentId, role: "THUMBNAIL", type: "IMAGE" },
      { file_path: "apartment/a/tour.mp4", context: "apartment", context_id: apartmentId, role: "REGULAR", type: "VIDEO" },
      { file_path: "common-space/hall.webp", context: "apartment-common", context_id: null, role: "REGULAR", type: "IMAGE" },
    ]);
  });

  it("keeps unit data, with the new fields defaulted", async () => {
    const { rows } = await legacy.query(
      `SELECT previous_tenant_annual_consumption_eur, has_private_parking, dpe_energy_rating
       FROM Apartments`,
    );
    expect(rows).toEqual([
      {
        previous_tenant_annual_consumption_eur: "912.50",
        has_private_parking: false,
        dpe_energy_rating: "C",
      },
    ]);
  });

  it("lowercases emails and hashes pending verification tokens", async () => {
    const { rows } = await legacy.query(
      "SELECT email, email_verification_token, token_version FROM Users",
    );
    expect(rows).toEqual([
      {
        email: "mixed.case@example.com",
        email_verification_token: (await import("../utils/hashToken")).hashToken(
          "raw-legacy-token",
        ),
        token_version: 0,
      },
    ]);
  });
});

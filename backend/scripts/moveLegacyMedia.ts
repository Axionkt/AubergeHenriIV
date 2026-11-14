/**
 * One-off: moves media stored in the pre-2026 layout into the current one
 * and updates Media.file_path to match.
 *
 *   old  <unitId>/<originalName>-<mediaId>.<ext>     common-space/<...>
 *   new  <context>/<unitId>/<mediaId>.<ext>          apartment-common/<mediaId>.<ext>
 *
 * Not required for serving (files are read from file_path wherever they
 * are); it makes the storage volume uniform and takes client file names
 * off the disk.
 *
 * Safe to stop and re-run: each file is renamed first and its row updated
 * right after, and a file already at its new path with a stale row is
 * just re-pointed. Run with --dry-run first, after a backup of the DB and
 * the storage volume:
 *
 *   docker compose -f docker-compose.prod.yml exec backend node build/scripts/moveLegacyMedia.js --dry-run
 *   docker compose -f docker-compose.prod.yml exec backend node build/scripts/moveLegacyMedia.js
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { Pool } from "pg";

interface MediaRow {
  id: string;
  context: string;
  context_id: string | null;
  file_path: string;
}

export interface MoveReport {
  moved: number;
  repointed: number;
  alreadyCurrent: number;
  problems: string[];
}

interface Options {
  pool: Pool;
  storageRoot: string;
  dryRun: boolean;
  log?: (line: string) => void;
}

/** Where a media file lives in the current layout (see MediaStorageService). */
export function currentPath(row: MediaRow): string {
  const ext = path.extname(row.file_path).toLowerCase();
  return path.posix.join(row.context, row.context_id ?? "", `${row.id}${ext}`);
}

const exists = (p: string) =>
  fs.access(p).then(
    () => true,
    () => false,
  );

export async function moveLegacyMedia({
  pool,
  storageRoot,
  dryRun,
  log = () => {},
}: Options): Promise<MoveReport> {
  const root = path.resolve(storageRoot);
  const inRoot = (relative: string) => {
    const full = path.resolve(root, relative);
    if (!full.startsWith(root + path.sep)) {
      throw new Error(`Path escapes the storage root: ${relative}`);
    }
    return full;
  };

  const report: MoveReport = {
    moved: 0,
    repointed: 0,
    alreadyCurrent: 0,
    problems: [],
  };
  const emptiedDirs = new Set<string>();

  const { rows } = await pool.query<MediaRow>(
    "SELECT id, context::text AS context, context_id, file_path FROM Media ORDER BY file_path",
  );

  for (const row of rows) {
    const from = row.file_path;
    const to = currentPath(row);

    if (from === to) {
      report.alreadyCurrent++;
      continue;
    }

    try {
      const src = inRoot(from);
      const dest = inRoot(to);
      const srcExists = await exists(src);
      const destExists = await exists(dest);

      if (!srcExists && destExists) {
        // A previous run moved the file but stopped before the update.
        log(`${dryRun ? "[dry-run] " : ""}re-point ${row.id}: ${from} -> ${to}`);
        if (!dryRun) await updatePath(pool, row.id, from, to);
        report.repointed++;
        continue;
      }
      if (!srcExists) {
        report.problems.push(`${row.id}: file missing at ${from}, row left as is`);
        continue;
      }
      if (destExists) {
        report.problems.push(`${row.id}: ${to} already exists, not overwritten`);
        continue;
      }

      log(`${dryRun ? "[dry-run] " : ""}move ${row.id}: ${from} -> ${to}`);
      if (dryRun) {
        report.moved++;
        continue;
      }

      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.rename(src, dest);
      try {
        await updatePath(pool, row.id, from, to);
      } catch (err) {
        await fs.rename(dest, src); // keep file and row in agreement
        throw err;
      }
      emptiedDirs.add(path.dirname(src));
      report.moved++;
    } catch (err) {
      report.problems.push(`${row.id}: ${(err as Error).message}`);
    }
  }

  // Old per-unit folders are now empty; rmdir refuses non-empty ones.
  for (const dir of emptiedDirs) {
    if (dir !== root) await fs.rmdir(dir).catch(() => {});
  }

  return report;
}

/** Only if the row still points where we found it (an admin may have acted meanwhile). */
async function updatePath(pool: Pool, id: string, from: string, to: string) {
  const res = await pool.query(
    "UPDATE Media SET file_path = $1 WHERE id = $2 AND file_path = $3",
    [to, id, from],
  );
  if (res.rowCount !== 1) {
    throw new Error("row changed during the move");
  }
}

if (require.main === module) {
  (async () => {
    const dryRun = process.argv.includes("--dry-run");
    // Loaded here so importing this file (tests) has no side effects.
    const { default: pool } = await import("../db");
    const { config } = await import("../config");

    try {
      const report = await moveLegacyMedia({
        pool,
        storageRoot: config.STORAGE_ROOT,
        dryRun,
        log: (line) => console.log(line),
      });
      console.log(
        dryRun
          ? `[dry-run] ${report.moved} to move, ${report.repointed} to re-point, `
          : `${report.moved} moved, ${report.repointed} re-pointed, `,
        `${report.alreadyCurrent} already in place, ${report.problems.length} problem(s)`,
      );
      for (const problem of report.problems) console.error(`  ! ${problem}`);
      process.exitCode = report.problems.length > 0 ? 1 : 0;
    } finally {
      await pool.end();
    }
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

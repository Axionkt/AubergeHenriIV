import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../app";
import pool from "../db";
import { moveLegacyMedia } from "../scripts/moveLegacyMedia";
import { authCookie, createUser, resetDatabase } from "./helpers";
import { createSpace, grantAccess } from "./spaceHelpers";

let root: string;

/** A file on disk plus its Media row, in the given (legacy) location. */
async function legacyMedia(
  context: string,
  contextId: string | null,
  filePath: string,
  role = "REGULAR",
): Promise<string> {
  fs.mkdirSync(path.join(root, path.dirname(filePath)), { recursive: true });
  fs.writeFileSync(path.join(root, filePath), `content of ${filePath}`);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO Media (file_path, mime_type, size_bytes, context, context_id, role, type)
     VALUES ($1, 'image/webp', 1, $2, $3, $4, 'IMAGE') RETURNING id`,
    [filePath, context, contextId, role],
  );
  return rows[0].id;
}

const filePathOf = async (id: string) =>
  (await pool.query("SELECT file_path FROM Media WHERE id = $1", [id])).rows[0]
    .file_path as string;

const run = (dryRun: boolean) =>
  moveLegacyMedia({ pool, storageRoot: root, dryRun });

describe("moveLegacyMedia script", () => {
  let unitId: string;
  let photo: string;
  let thumb: string;
  let common: string;

  beforeEach(async () => {
    await resetDatabase();
    root = fs.mkdtempSync(path.join(os.tmpdir(), "auberge-move-"));
    unitId = await createSpace("apartment");
    photo = await legacyMedia("apartment", unitId, `${unitId}/Salon Vue-x.WEBP`);
    thumb = await legacyMedia("apartment", unitId, `${unitId}/facade-y.webp`, "THUMBNAIL");
    common = await legacyMedia("apartment-common", null, "common-space/hall-z.webp");
  });

  it("changes nothing in dry-run mode", async () => {
    const report = await run(true);

    expect(report).toMatchObject({ moved: 3, problems: [] });
    expect(await filePathOf(photo)).toBe(`${unitId}/Salon Vue-x.WEBP`);
    expect(fs.existsSync(path.join(root, `${unitId}/Salon Vue-x.WEBP`))).toBe(true);
    expect(fs.existsSync(path.join(root, "apartment"))).toBe(false);
  });

  it("moves files to <context>/<unit>/<mediaId>.<ext>, updates rows, removes old folders", async () => {
    const report = await run(false);
    expect(report).toEqual({ moved: 3, repointed: 0, alreadyCurrent: 0, problems: [] });

    const expected: Record<string, string> = {
      [photo]: `apartment/${unitId}/${photo}.webp`,
      [thumb]: `apartment/${unitId}/${thumb}.webp`,
      [common]: `apartment-common/${common}.webp`,
    };
    for (const [id, newPath] of Object.entries(expected)) {
      expect(await filePathOf(id)).toBe(newPath);
      expect(fs.existsSync(path.join(root, newPath))).toBe(true);
    }
    expect(fs.readFileSync(path.join(root, expected[common]), "utf8")).toBe(
      "content of common-space/hall-z.webp",
    );
    // Old folders are gone; nothing else is left behind.
    expect(fs.readdirSync(root).sort()).toEqual(["apartment", "apartment-common"]);

    // The app serves the new location.
    const tenant = await createUser();
    await grantAccess("apartment", tenant.id, unitId);
    const res = await request(app)
      .get(`/media/${photo}`)
      .set("Cookie", authCookie(tenant));
    expect(res.headers["x-accel-redirect"]).toBe(`/internal/storage/${expected[photo]}`);
  });

  it("is a no-op when run again", async () => {
    await run(false);
    expect(await run(false)).toEqual({
      moved: 0,
      repointed: 0,
      alreadyCurrent: 3,
      problems: [],
    });
  });

  it("finishes a run that stopped between moving a file and updating its row", async () => {
    // Simulate the crash: file already at its new place, row still old.
    const newPath = `apartment/${unitId}/${photo}.webp`;
    fs.mkdirSync(path.join(root, `apartment/${unitId}`), { recursive: true });
    fs.renameSync(
      path.join(root, `${unitId}/Salon Vue-x.WEBP`),
      path.join(root, newPath),
    );

    const report = await run(false);

    expect(report).toMatchObject({ moved: 2, repointed: 1, problems: [] });
    expect(await filePathOf(photo)).toBe(newPath);
  });

  it("reports a missing file and leaves its row alone", async () => {
    fs.unlinkSync(path.join(root, "common-space/hall-z.webp"));

    const report = await run(false);

    expect(report.moved).toBe(2);
    expect(report.problems).toEqual([
      `${common}: file missing at common-space/hall-z.webp, row left as is`,
    ]);
    expect(await filePathOf(common)).toBe("common-space/hall-z.webp");
  });

  it("refuses paths that would leave the storage root", async () => {
    await pool.query("UPDATE Media SET file_path = '../outside.webp' WHERE id = $1", [
      common,
    ]);

    const report = await run(false);

    expect(report.problems).toEqual([
      `${common}: Path escapes the storage root: ../outside.webp`,
    ]);
  });
});

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { Request, Response, NextFunction } from "express";
import {
  MAX_MEDIA_AT_ONCE,
  MAX_MEDIA_SIZE_BYTES,
  MAX_PLAN_SIZE_BYTES,
  MAX_THUMBNAIL_SIZE_BYTES,
} from "../schemas/shared/fileUpload";
import { config } from "../config";

/**
 * Temp dir for files multer has received but we haven't validated yet.
 * Keep it on the SAME filesystem/volume as STORAGE_ROOT so moving a file
 * into place is an atomic rename instead of a copy. The default below
 * (inside STORAGE_ROOT) guarantees that. Files are only ever reached via
 * the DB-backed /media/:id route, so nothing serves this folder.
 */
const UPLOAD_TMP_DIR =
  config.UPLOAD_TMP_DIR ?? path.join(config.STORAGE_ROOT!, ".tmp");

export const uploadMedia = multer({
  dest: UPLOAD_TMP_DIR,
  limits: { fileSize: MAX_MEDIA_SIZE_BYTES, files: MAX_MEDIA_AT_ONCE },
});

const singletonUpload = {
  dest: UPLOAD_TMP_DIR,
  limits: {
    files: 1,
  },
};

export const uploadThumbnail = multer({
  ...singletonUpload,
  limits: {
    ...singletonUpload.limits,
    fileSize: MAX_THUMBNAIL_SIZE_BYTES,
  },
});

export const uploadPlan = multer({
  ...singletonUpload,
  limits: {
    ...singletonUpload.limits,
    fileSize: MAX_PLAN_SIZE_BYTES,
  },
});

/** Moves a validated temp file to its final location. */
export async function moveFile(src: string, dest: string): Promise<void> {
  try {
    await fsp.rename(src, dest);
  } catch (err) {
    // Temp dir and storage root are on different filesystems/volumes.
    if ((err as NodeJS.ErrnoException).code !== "EXDEV") throw err;
    await fsp.copyFile(src, dest);
    await fsp.unlink(src);
  }
}

/**
 * Deletes whatever is still in the temp dir once the response is over:
 * validation failed, the DB insert threw, the client disconnected...
 * Files that were already moved no longer exist at the temp path, so
 * unlinking them just yields a harmless ENOENT.
 */
export function cleanupUploads(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("close", () => {
    const files: Express.Multer.File[] = [];
    if (req.file) files.push(req.file);
    if (Array.isArray(req.files)) files.push(...req.files);
    else if (req.files) files.push(...Object.values(req.files).flat());

    for (const f of files) {
      if (f.path) fs.unlink(f.path, () => {});
    }
  });
  next();
}

/**
 * Safety net for crashes/kills that skip the `close` handler above.
 * Call it in a cron job.
 */
export async function purgeStaleUploads(maxAgeMs = 60 * 60 * 1000) {
  const entries = await fsp
    .readdir(UPLOAD_TMP_DIR, { withFileTypes: true })
    .catch(() => []);
  const cutoff = Date.now() - maxAgeMs;

  await Promise.allSettled(
    entries
      .filter((e) => e.isFile())
      .map(async (e) => {
        const p = path.join(UPLOAD_TMP_DIR, e.name);
        const { mtimeMs } = await fsp.stat(p);
        if (mtimeMs < cutoff) await fsp.unlink(p);
      }),
  );
}

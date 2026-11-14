import path from "path";
import fs from "fs/promises";
import { PoolClient } from "pg";
import { SavedFile } from "../types/media";
import { MediaRole } from "../models/Media";
import { MediaContext } from "../schemas/media";
import {
  buildSafeStorageFilename,
  ValidatedUploadFile,
} from "../schemas/shared/fileUpload";
import { moveFile } from "../utils/uploadStorage";
import { InternalServerError } from "../utils/errors/InternalServerError";
import { logError } from "../utils/logger";
import { config } from "../config";
import MediaRepository from "./MediaRepository";

const STORAGE_ROOT = config.STORAGE_ROOT!;

export default class MediaStorageService {
/**
 * Writes the DB row, then moves the validated temp file to
 * STORAGE_ROOT/<context>/<id>/<random>.<ext>. Must run inside the caller's
 * transaction: if anything later fails, the caller rolls back and deletes
 * the moved file.
 */
  public static async insertAndSaveFile({
    client,
    validatedFile,
    context,
    contextId,
    role = "REGULAR",
  }: {
    client: PoolClient;
    validatedFile: ValidatedUploadFile;
    context: MediaContext;
    contextId: string | null;
    role?: MediaRole;
  }): Promise<SavedFile> {
    const { size, path: tempPath, type, mimetype: mime } = validatedFile;

    if (!tempPath) {
      throw new InternalServerError(
        "Le fichier n'a pas pu être lu (aucun fichier temporaire).",
      );
    }

    const filename = buildSafeStorageFilename(validatedFile);

    let diskPath: string | null = null;

    try {
      const { id, oldFilePath } =
        role === "REGULAR"
          ? await MediaRepository.insertRegularMedia({
              client,
              context,
              contextId,
              type,
              mime,
              size,
            })
          : await MediaRepository.upsertSingletonMedia({
              client,
              context,
              contextId,
              type,
              mime,
              size,
              role,
            });

      const relativePath = path.join(context, contextId ?? "", filename);
      diskPath = path.join(STORAGE_ROOT, relativePath);

      await client.query(`UPDATE Media SET file_path = $1 WHERE id = $2`, [
        relativePath,
        id,
      ]);

      await fs.mkdir(path.dirname(diskPath), { recursive: true });
      await moveFile(tempPath, diskPath);

      return {
        id,
        filePath: relativePath,
        diskPath,
        oldFilePath,
      };
    } catch (error) {
      if (diskPath) {
        await fs.unlink(diskPath).catch((cleanupError) => {
          if (cleanupError.code !== "ENOENT") {
            logError(cleanupError, {
              forceServerError: true,
              operation: "cleanupFailedMediaUpload",
            });
          }
        });
      }

      throw error;
    }
  }

  public static async cleanupFiles(
    files: { diskPath: string }[],
  ): Promise<void> {
    const results = await Promise.allSettled(
      files.map((file) => fs.unlink(file.diskPath)),
    );

    results.forEach((result) => {
      if (result.status === "rejected") {
        if (result.reason?.code === "ENOENT") return;

        logError(result.reason, {
          forceServerError: true,
          operation: "cleanupMediaFile",
        });
      }
    });
  }

  public static async cleanupFolder(
    context: MediaContext,
    contextId: string | null,
  ): Promise<void> {
    const folderPath = path.join(STORAGE_ROOT, context, contextId ?? "");
    await fs.rm(folderPath, { recursive: true, force: true });
  }
}

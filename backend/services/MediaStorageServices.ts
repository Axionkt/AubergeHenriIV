import path from "path";
import fs from "fs/promises";
import { PoolClient } from "pg";
import { SavedFile, MediaType } from "../types/media";
import { BadRequestError } from "../utils/errors/BadRequestError";
import Media from "../models/Media";
import { MediaContext } from "../schemas/media";
import {
  getFileExtension,
  ValidatedUploadFile,
} from "../schemas/shared/fileUpload";

const STORAGE_ROOT = process.env.STORAGE_ROOT!;

export default class MediaStorageServices {
  private static getMediaType(mime: string): MediaType {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    throw new BadRequestError(`Cannot determine media type for mime: ${mime}`);
  }

  public static async insertAndSaveFile({
    client,
    validatedFile,
    context,
    contextId,
    isThumbnail = false,
  }: {
    client: PoolClient;
    validatedFile: ValidatedUploadFile;
    context: MediaContext;
    contextId: string | null;
    isThumbnail?: boolean;
  }): Promise<SavedFile> {
    const { mimetype: mime, size, originalname, buffer } = validatedFile;

    if (!buffer) {
      throw new Error(
        "Le fichier n'a pas pu être lu (aucune donnée en mémoire).",
      );
    }

    const ext = getFileExtension(originalname);
    const sanitizedName = ext
      ? originalname.slice(0, -(ext.length + 1))
      : originalname;
    const type = this.getMediaType(mime);

    if (isThumbnail) {
      const existing = await client.query<Media>(
        `SELECT * FROM Media
           WHERE context = $1 
            AND context_id = $2 
            AND is_thumbnail = TRUE`,
        [context, contextId],
      );
      const oldFilePath = existing.rows[0]?.file_path ?? null;

      const result = await client.query(
        `INSERT INTO Media (context, context_id, type, mime_type, size_bytes, file_path, is_thumbnail, display_order)
          VALUES ($1, $2, $3, $4, $5, '', TRUE, 0)
          ON CONFLICT (context, context_id) WHERE is_thumbnail = TRUE
          DO UPDATE SET
            type      = EXCLUDED.type,
            mime_type = EXCLUDED.mime_type,
            file_path = ''
          RETURNING id`,
        [context, contextId, type, mime, size],
      );

      const id = result.rows[0].id;
      const filename = `${sanitizedName}-${id}.${ext}`;
      const relativePath = path.join(contextId ?? context, filename);
      const diskPath = path.join(STORAGE_ROOT, relativePath);

      await client.query("UPDATE Media SET file_path = $1 WHERE id = $2", [
        relativePath,
        id,
      ]);

      await fs.mkdir(path.join(STORAGE_ROOT, contextId ?? context), {
        recursive: true,
      });
      await fs.writeFile(diskPath, buffer);

      return { id, filePath: relativePath, diskPath, oldFilePath };
    }

    const result = await client.query(
      `INSERT INTO Media (
        context,
        context_id,
        type,
        mime_type,
        file_path,
        size_bytes,
        is_thumbnail,
        display_order
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        '',
        $5,
        FALSE,
        COALESCE(
          (SELECT MAX(display_order) + 1 
            FROM Media
            WHERE context = $1 
              AND ($2::uuid IS NULL OR context_id = $2)), 1)
      )
      RETURNING id`,
      [context, contextId, type, mime, size],
    );

    const id = result.rows[0].id;
    const filename = `${sanitizedName}-${id}.${ext}`;
    const relativePath = path.join(contextId ?? context, filename);
    const diskPath = path.join(STORAGE_ROOT, relativePath);

    await client.query("UPDATE Media SET file_path = $1 WHERE id = $2", [
      relativePath,
      id,
    ]);

    await fs.mkdir(path.join(STORAGE_ROOT, contextId ?? context), {
      recursive: true,
    });
    await fs.writeFile(diskPath, buffer);

    return { id, filePath: relativePath, diskPath, oldFilePath: null };
  }

  public static async cleanupFiles(files: { diskPath: string }[]) {
    await Promise.allSettled(
      files.map((f) =>
        fs.unlink(f.diskPath).catch((err) => {
          if (err.code !== "ENOENT") throw err;
        }),
      ),
    );
  }

  public static async cleanupFolder(
    context: MediaContext,
    contextId: string | null,
  ) {
    const folderPath = path.join(STORAGE_ROOT, contextId ?? context);
    await fs.rm(folderPath, { recursive: true, force: true });
  }
}

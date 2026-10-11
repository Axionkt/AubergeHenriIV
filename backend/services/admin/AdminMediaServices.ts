import path from "path";
import pool from "../../db";
import { BadRequestError } from "../../utils/errors/BadRequestError";
import { NotFoundError } from "../../utils/errors/NotFoundError";
import { MediaItem, SavedFile } from "../../types/media";
import MediaStorageServices from "../MediaStorageServices";
import { MediaContext } from "../../schemas/media";
import { ValidatedUploadFile } from "../../schemas/shared/fileUpload";

export default class AdminMediaServices {
  private static async assertApartmentExists(contextId: string): Promise<void> {
    const result = await pool.query("SELECT id FROM Apartments WHERE id = $1", [
      contextId,
    ]);
    if (result.rowCount === 0)
      throw new NotFoundError("Appartement introuvable.");
  }

  private static async assertProSpaceExists(contextId: string): Promise<void> {
    const result = await pool.query("SELECT id FROM ProSpaces WHERE id = $1", [
      contextId,
    ]);
    if (result.rowCount === 0)
      throw new NotFoundError("Espace professionnel introuvable.");
  }

  public static async assertContextExists(
    context: MediaContext,
    contextUuid?: string,
    isThumbnail: boolean = false,
  ): Promise<void> {
    switch (context) {
      case "apartment":
        if (!contextUuid)
          throw new BadRequestError("UUID de l'appartement manquant.");
        return this.assertApartmentExists(contextUuid);
      case "pro-space":
        if (!contextUuid)
          throw new BadRequestError("UUID de l'espace professionnel manquant.");
        return this.assertProSpaceExists(contextUuid);
      case "common-space":
        if (isThumbnail)
          throw new BadRequestError(
            "Les miniatures ne sont pas prises en charge pour les espaces communs.",
          );
        return; // There is no distinction between common spaces, so it always exists
      default:
        throw new BadRequestError(`Contexte inconnu : ${context}`);
    }
  }

  public static async uploadMediaFiles(
    validatedFiles: ValidatedUploadFile[],
    context: MediaContext,
    contextId: string | null = null,
  ): Promise<MediaItem[]> {
    const client = await pool.connect();
    const saved: SavedFile[] = [];

    try {
      await client.query("BEGIN");

      for (const validatedFile of validatedFiles) {
        const savedFile = await MediaStorageServices.insertAndSaveFile({
          client,
          validatedFile,
          context,
          contextId,
          isThumbnail: false,
        });
        saved.push(savedFile);
      }

      await client.query("COMMIT");

      return saved.map((f) => ({
        id: f.id,
        type: validatedFiles[saved.indexOf(f)].mimetype.startsWith("video/")
          ? "video"
          : "image",
        url: `/media/${f.id}`,
      }));
    } catch (err) {
      await client.query("ROLLBACK");
      await MediaStorageServices.cleanupFiles(saved);
      throw err;
    } finally {
      client.release();
    }
  }

  public static async reorderMediaFiles(
    mediaIds: string[],
    context: MediaContext,
    contextId: string | null = null,
  ): Promise<void> {
    const result = await pool.query(
      `UPDATE Media
       SET display_order = idx
       FROM (SELECT unnest($1::uuid[]) AS id, generate_series(1, array_length($1::uuid[], 1)) AS idx) AS new_order
       WHERE media.id = new_order.id
         AND media.context = $2
         AND ($3::uuid IS NULL OR context_id = $3)
         AND media.is_thumbnail = FALSE`,
      [mediaIds, context, contextId],
    );

    if (result.rowCount !== mediaIds.length) {
      throw new NotFoundError(
        "Un ou plusieurs fichiers sont introuvables ou n'appartiennent pas à cette entité.",
      );
    }
  }

  public static async deleteMediaFiles(
    mediaIds: string[],
    context: MediaContext,
    contextId: string | null = null,
  ): Promise<void> {
    const client = await pool.connect();
    let deletedRows: { file_path: string }[] = [];

    try {
      await client.query("BEGIN");

      const result = await client.query<{ file_path: string }>(
        `DELETE FROM media
       WHERE id = ANY($1)
         AND context = $2
         AND ($3::uuid IS NULL OR context_id = $3)
         AND is_thumbnail = FALSE
       RETURNING file_path`,
        [mediaIds, context, contextId],
      );

      console.log(mediaIds, context, contextId, result.rowCount);

      if (result.rowCount !== mediaIds.length) {
        throw new NotFoundError(
          "Un ou plusieurs fichiers sont introuvables ou n'appartiennent pas à cette entité.",
        );
      }

      deletedRows = result.rows;

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    await MediaStorageServices.cleanupFiles(
      deletedRows.map((r) => ({
        diskPath: path.join(process.env.STORAGE_ROOT!, r.file_path),
      })),
    );
  }

  public static async uploadThumbnail(
    validatedFile: ValidatedUploadFile,
    context: MediaContext,
    contextId: string,
  ): Promise<MediaItem> {
    const client = await pool.connect();
    const saved: SavedFile[] = [];

    try {
      await client.query("BEGIN");

      const savedFile = await MediaStorageServices.insertAndSaveFile({
        client,
        validatedFile,
        context,
        contextId,
        isThumbnail: true,
      });
      saved.push(savedFile);

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      await MediaStorageServices.cleanupFiles(saved);
      throw err;
    } finally {
      client.release();
    }

    if (saved[0].oldFilePath && saved[0].oldFilePath !== saved[0].filePath) {
      await MediaStorageServices.cleanupFiles([
        {
          diskPath: path.join(process.env.STORAGE_ROOT!, saved[0].oldFilePath),
        },
      ]);
    }

    return {
      id: saved[0].id,
      type: "image",
      url: `/media/${saved[0].id}`,
    };
  }

  public static async deleteThumbnail(
    context: MediaContext,
    contextId: string,
  ): Promise<void> {
    const client = await pool.connect();
    let deletedRow: { file_path: string } | null = null;

    try {
      await client.query("BEGIN");

      const result = await client.query<{ file_path: string }>(
        `DELETE FROM media
       WHERE context = $1
         AND context_id = $2
         AND is_thumbnail = TRUE
       RETURNING file_path`,
        [context, contextId],
      );

      if (result.rowCount === 0) {
        throw new NotFoundError("Aucune miniature trouvée pour cette entité.");
      }

      deletedRow = result.rows[0];

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    await MediaStorageServices.cleanupFiles([
      {
        diskPath: path.join(process.env.STORAGE_ROOT!, deletedRow!.file_path),
      },
    ]);
  }
}

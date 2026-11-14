import path from "path";
import pool from "../../db";
import { BadRequestError } from "../../utils/errors/BadRequestError";
import { NotFoundError } from "../../utils/errors/NotFoundError";
import { MediaItem, SavedFile } from "../../types/media";
import MediaStorageService from "../MediaStorageService";
import { MediaContext } from "../../schemas/media";
import { ValidatedUploadFile } from "../../schemas/shared/fileUpload";
import { logError } from "../../utils/logger";
import { ApartmentService, ProSpaceService } from "../spaces/SpaceService";
import { MediaRole, SingletonMediaRole } from "../../models/Media";
import { config } from "../../config";
import { PoolClient } from "pg";

type DeleteMediaOptions = {
  mediaIds?: string[];
  roles?: MediaRole[];
};

export default class AdminMediaService {
/**
 * Saves a batch of gallery files all-or-nothing: one transaction for the
 * rows, and every already-moved file is deleted if any step fails.
 */
  public static async uploadResourceMediaFiles(
    context: MediaContext,
    contextId: string | null,
    validatedFiles: ValidatedUploadFile[],
  ): Promise<MediaItem[]> {
    const client = await pool.connect();
    const saved: SavedFile[] = [];

    try {
      await client.query("BEGIN");

      for (const validatedFile of validatedFiles) {
        const savedFile = await MediaStorageService.insertAndSaveFile({
          client,
          validatedFile,
          context,
          contextId,
          role: "REGULAR",
        });
        saved.push(savedFile);
      }

      await client.query("COMMIT");

      return saved.map((f, i) => ({
        id: f.id,
        type: validatedFiles[i].type,
        url: `/media/${f.id}`,
      }));
    } catch (err) {
      await client.query("ROLLBACK").catch((rollbackErr) => {
        logError(rollbackErr, {
          forceServerError: true,
          operation: "rollbackMediaUpload",
        });
      });
      await MediaStorageService.cleanupFiles(saved);
      throw err;
    } finally {
      client.release();
    }
  }

/**
 * Sets or replaces a thumbnail/plan. The previous file is only deleted
 * after commit, so a failed upload never loses the existing one.
 */
  public static async uploadResourceSingleton(
    context: MediaContext,
    contextId: string,
    role: SingletonMediaRole,
    validatedFile: ValidatedUploadFile,
  ): Promise<MediaItem> {
    const client = await pool.connect();
    let savedFile: SavedFile | undefined;

    try {
      await client.query("BEGIN");

      savedFile = await MediaStorageService.insertAndSaveFile({
        client,
        validatedFile,
        context,
        contextId,
        role,
      });

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch((rollbackErr) => {
        logError(rollbackErr, {
          forceServerError: true,
          operation: "rollbackSingletonMediaUpload",
        });
      });

      if (savedFile) {
        await MediaStorageService.cleanupFiles([savedFile]);
      }

      throw err;
    } finally {
      client.release();
    }

    if (savedFile.oldFilePath && savedFile.oldFilePath !== savedFile.filePath) {
      await MediaStorageService.cleanupFiles([
        {
          diskPath: path.join(config.STORAGE_ROOT!, savedFile.oldFilePath),
        },
      ]);
    }

    return {
      id: savedFile.id,
      type: validatedFile.type,
      url: `/media/${savedFile.id}`,
    };
  }

/**
 * Sets display_order from the array order. Fails with 404 if any id doesn't
 * belong to this context, so ids from another resource can't be touched.
 */
  public static async reorderResourceMediaFiles(
    context: MediaContext,
    contextId: string | null,
    mediaIds: string[],
  ): Promise<void> {
    const result = await pool.query(
      `UPDATE Media
       SET display_order = idx
       FROM (SELECT unnest($1::uuid[]) AS id, generate_series(1, array_length($1::uuid[], 1)) AS idx) AS new_order
       WHERE media.id = new_order.id
         AND media.context = $2
         AND ($3::uuid IS NULL OR context_id = $3)
         AND media.role = 'REGULAR'`,
      [mediaIds, context, contextId],
    );

    if (result.rowCount !== mediaIds.length) {
      throw new NotFoundError(
        "Un ou plusieurs fichiers sont introuvables ou n'appartiennent pas à cette entité.",
      );
    }
  }

/**
 * Deletes media rows inside the caller's transaction and returns their disk
 * paths; the caller removes the files only after COMMIT.
 */
  public static async deleteResourceMediaFilesWithClient(
    client: PoolClient,
    context: MediaContext,
    contextId: string | null = null,
    options: DeleteMediaOptions = {},
  ): Promise<string[]> {
    const { mediaIds, roles } = options;

    if (mediaIds !== undefined && mediaIds.length === 0) {
      return [];
    }

    const uniqueMediaIds = mediaIds ? [...new Set(mediaIds)] : undefined;
    const uniqueRoles = roles ? [...new Set(roles)] : undefined;

    const values: unknown[] = [context, contextId];

    let query = `
      DELETE FROM Media
      WHERE context = $1
        AND context_id IS NOT DISTINCT FROM $2::uuid`;

    if (uniqueRoles !== undefined) {
      values.push(uniqueRoles);
      query += ` AND role = ANY($${values.length}::media_role[])`;
    }

    if (uniqueMediaIds !== undefined) {
      values.push(uniqueMediaIds);
      query += ` AND id = ANY($${values.length}::uuid[])`;
    }

    query += ` RETURNING file_path`;

    const result = await client.query<{ file_path: string }>(query, values);

    if (
      uniqueMediaIds !== undefined &&
      result.rows.length !== uniqueMediaIds.length
    ) {
      throw new NotFoundError(
        "Un ou plusieurs fichiers sont introuvables ou n'appartiennent pas à cette entité.",
      );
    }

    return result.rows.map((row) =>
      path.join(config.STORAGE_ROOT!, row.file_path),
    );
  }

  public static async deleteResourceMediaFiles(
    context: MediaContext,
    contextId: string | null = null,
    options: DeleteMediaOptions = {},
  ): Promise<void> {
    if (options.mediaIds !== undefined && options.mediaIds.length === 0) {
      return;
    }

    const client = await pool.connect();
    let diskPaths: string[] = [];

    try {
      await client.query("BEGIN");

      diskPaths = await this.deleteResourceMediaFilesWithClient(
        client,
        context,
        contextId,
        options,
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch((rollbackErr) => {
        logError(rollbackErr, {
          forceServerError: true,
          operation: "rollbackMediaDelete",
        });
      });

      throw err;
    } finally {
      client.release();
    }

    await MediaStorageService.cleanupFiles(
      diskPaths.map((diskPath) => ({ diskPath })),
    );
  }

/**
 * Checks the upload target before touching the database: the space exists,
 * or, for common spaces, that no id and no thumbnail/plan was given.
 */
  public static async assertContextExists(
    context: MediaContext,
    contextUuid: string | null = null,
    isThumbnail: boolean = false,
  ): Promise<void> {
    switch (context) {
      case "apartment":
        if (!contextUuid) {
          throw new BadRequestError("UUID de l'appartement manquant.");
        }
        return ApartmentService.assertExists(contextUuid);

      case "pro-space":
        if (!contextUuid) {
          throw new BadRequestError("UUID de l'espace professionnel manquant.");
        }
        return ProSpaceService.assertExists(contextUuid);

      case "apartment-common":
      case "pro-space-common":
        // Common spaces are a single shared gallery with no id.
        if (contextUuid) {
          throw new BadRequestError(
            "Les espaces communs ne prennent pas d'identifiant.",
          );
        }
        if (isThumbnail) {
          throw new BadRequestError(
            "Les miniatures ne sont pas prises en charge pour les espaces communs.",
          );
        }
        return;

      default:
        throw new BadRequestError(`Contexte inconnu : ${context}`);
    }
  }
}

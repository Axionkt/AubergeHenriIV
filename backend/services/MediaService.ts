import pool from "../db";
import Media, { MediaType, SingletonMediaRole } from "../models/Media";
import { MediaContext } from "../schemas/media";
import {
  AdminMediaItem,
  MediaCount,
  MediaItem,
  MediaRecord,
  ResourceSingleton,
} from "../types/media";
import { NotFoundError } from "../utils/errors/NotFoundError";

export default class MediaService {
  public static async getMedia(mediaId: string): Promise<MediaRecord> {
    const result = await pool.query<MediaRecord>(
      `SELECT file_path, mime_type, role, context, context_id
     FROM Media
     WHERE id = $1`,
      [mediaId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundError("Média introuvable.");
    }

    return result.rows[0];
  }

  public static async getResourceMediaItems<T extends boolean = false>(
    context: MediaContext,
    contextId: string | null,
    includeAdminInfo: T = false as T,
  ): Promise<(T extends true ? AdminMediaItem : MediaItem)[]> {
    const values: unknown[] = [context];
    let contextCondition = "";

    if (contextId !== null) {
      values.push(contextId);
      contextCondition = `AND context_id = $2`;
    }

    const result = await pool.query<
      Pick<Media, "id" | "type" | "size_bytes" | "created_at">
    >(
      `SELECT id, type, size_bytes, created_at
       FROM Media
       WHERE context = $1
         ${contextCondition}
         AND role = 'REGULAR'
       ORDER BY display_order ASC`,
      values,
    );

    return result.rows.map((m) => {
      const item = {
        id: m.id,
        type: m.type,
        url: `/media/${m.id}`,
      };

      if (includeAdminInfo) {
        return {
          ...item,
          sizeBytes: m.size_bytes,
          createdAt: m.created_at.toISOString(),
        };
      }

      return item;
    }) as (T extends true ? AdminMediaItem : MediaItem)[];
  }

  /**
   * Retrieves a singleton media item for one specific resource.
   * A null contextId explicitly targets media with context_id IS NULL.
   */
  public static async getSingleton(
    context: MediaContext,
    contextId: string | null,
    role: SingletonMediaRole,
  ): Promise<ResourceSingleton | null> {
    const result = await pool.query<ResourceSingleton>(
      `SELECT id, type
       FROM Media
       WHERE context = $1
         AND context_id IS NOT DISTINCT FROM $2::uuid
         AND role = $3`,
      [context, contextId, role],
    );

    return result.rows[0] ?? null;
  }

  /**
   * Retrieves singleton media items for all resources in a context.
   * The returned map is keyed by context_id.
   */
  public static async getSingletonsByContext(
    context: MediaContext,
    role: SingletonMediaRole,
  ): Promise<Map<string, ResourceSingleton>> {
    const result = await pool.query<{
      contextId: string;
      id: string;
      type: MediaType;
    }>(
      `SELECT
         context_id AS "contextId",
         id,
         type
       FROM Media
       WHERE context = $1
         AND role = $2
         AND context_id IS NOT NULL`,
      [context, role],
    );

    return new Map(
      result.rows.map((row) => [
        row.contextId,
        {
          id: row.id,
          type: row.type,
        },
      ]),
    );
  }

  /**
   * Retrieves media counts for one specific resource.
   * A null contextId explicitly targets media with context_id IS NULL.
   */
  public static async getMediaCount(
    context: MediaContext,
    contextId: string | null,
  ): Promise<MediaCount | null> {
    const result = await pool.query<MediaCount>(
      `SELECT
         context,
         context_id AS "contextId",
         COUNT(*) FILTER (WHERE type = 'IMAGE')::int AS "numImages",
         COUNT(*) FILTER (WHERE type = 'VIDEO')::int AS "numVideos"
       FROM Media
       WHERE context = $1
         AND context_id IS NOT DISTINCT FROM $2::uuid
         AND role = 'REGULAR'
       GROUP BY context, context_id`,
      [context, contextId],
    );

    return result.rows[0] ?? null;
  }

  /**
   * Retrieves media counts for all resources in a context.
   * The returned map is keyed by context_id.
   */
  public static async getMediaCountsByContext(
    context: MediaContext,
  ): Promise<Map<string, MediaCount>> {
    const result = await pool.query<MediaCount>(
      `SELECT
         context,
         context_id AS "contextId",
         COUNT(*) FILTER (WHERE type = 'IMAGE')::int AS "numImages",
         COUNT(*) FILTER (WHERE type = 'VIDEO')::int AS "numVideos"
       FROM Media
       WHERE context = $1
         AND role = 'REGULAR'
         AND context_id IS NOT NULL
       GROUP BY context, context_id`,
      [context],
    );

    return new Map(result.rows.map((row) => [row.contextId, row]));
  }
}

import { PoolClient } from "pg";
import { MediaType, SingletonMediaRole } from "../models/Media";
import { MediaContext } from "../schemas/media";

interface InsertRegularMediaParams {
  client: PoolClient;
  context: MediaContext;
  contextId: string | null;
  type: MediaType;
  mime: string;
  size: number;
}

interface UpsertSingletonMediaParams extends InsertRegularMediaParams {
  role: SingletonMediaRole;
}

export default class MediaRepository {
/**
 * Inserts a gallery item at the end of its context's display order.
 * file_path is filled in by the caller once the final id is known.
 */
  public static async insertRegularMedia({
    client,
    context,
    contextId,
    type,
    mime,
    size,
  }: InsertRegularMediaParams): Promise<{
    id: string;
    oldFilePath: null;
  }> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO Media (
        context,
        context_id,
        type,
        role,
        mime_type,
        file_path,
        size_bytes,
        display_order
      )
      VALUES (
        $1,
        $2,
        $3,
        'REGULAR',
        $4,
        '',
        $5,
        COALESCE(
          (
            SELECT MAX(display_order) + 1
            FROM Media
            WHERE context = $1
              AND context_id IS NOT DISTINCT FROM $2::uuid
              AND role = 'REGULAR'
          ),
          1
        )
      )
      RETURNING id`,
      [context, contextId, type, mime, size],
    );

    return {
      id: result.rows[0].id,
      oldFilePath: null,
    };
  }

/**
 * Inserts or replaces the thumbnail/plan of a resource (one per role, via
 * the unique index) and returns the previous file path so the old file can
 * be deleted after commit.
 */
  public static async upsertSingletonMedia({
    client,
    context,
    contextId,
    type,
    mime,
    size,
    role,
  }: UpsertSingletonMediaParams): Promise<{
    id: string;
    oldFilePath: string | null;
  }> {
    // Retrieve the previous file path so it can be cleaned up after commit.
    const existing = await client.query<{ file_path: string }>(
      `SELECT file_path
       FROM Media
       WHERE context = $1
         AND context_id IS NOT DISTINCT FROM $2::uuid
         AND role = $3
       FOR UPDATE`,
      [context, contextId, role],
    );

    const oldFilePath = existing.rows[0]?.file_path ?? null;

    const result = await client.query<{ id: string }>(
      `INSERT INTO Media (
        context,
        context_id,
        type,
        role,
        mime_type,
        size_bytes,
        file_path,
        display_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, '', 0)
      ON CONFLICT (context, context_id, role)
        WHERE role IN ('THUMBNAIL', 'PLAN')
      DO UPDATE SET
        type = EXCLUDED.type,
        mime_type = EXCLUDED.mime_type,
        size_bytes = EXCLUDED.size_bytes,
        file_path = '',
        display_order = 0
      RETURNING id`,
      [context, contextId, type, role, mime, size],
    );

    return {
      id: result.rows[0].id,
      oldFilePath,
    };
  }
}

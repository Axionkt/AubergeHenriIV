import { PoolClient } from "pg";
import pool from "../../db";
import { sendInBackground } from "../../emails/mailer";
import { notifyAccessGranted } from "../../emails/notify";
import type { SpaceRow } from "../../models/Space";
import type { SharedSpaceInput } from "../../schemas/space";
import type {
  SpaceAccessGrant,
  SpaceAccessRevoke,
} from "../../schemas/userAccess";
import type { CommonSpaceMediaDTO } from "../../types/commonSpace";
import type {
  AdminMediaItem,
  MediaCount,
  ResourceSingleton,
} from "../../types/media";
import type {
  SpaceDetailsAdminDTO,
  SpaceItemAdminDTO,
  SpaceMediaListDTO,
  SpaceUserAccess,
} from "../../types/space";
import { NotFoundError } from "../../utils/errors/NotFoundError";
import { logError } from "../../utils/logger";
import { settle } from "../../utils/settle";
import MediaService from "../MediaService";
import MediaStorageService from "../MediaStorageService";
import {
  apartmentKind,
  proSpaceKind,
  type SpaceKind,
} from "../spaces/spaceKinds";
import { sharedToDB, toSpaceBase } from "../spaces/spaceMappers";
import AdminMediaService from "./AdminMediaService";

interface UserAccessRow {
  user_id: string;
  first_name: string;
  last_name: string;
  space_id: string;
  space_name: string;
  access_expiry: Date | null;
}

/**
 * Admin CRUD, availability and access grants for one kind of space. Same
 * factory pattern as createSpaceService.
 */
export function createAdminSpaceService<
  TRow extends SpaceRow,
  TExtra extends object,
  TExtraInput extends object,
>(kind: SpaceKind<TRow, TExtra, TExtraInput>) {
  const {
    table,
    accessTable,
    accessColumn,
    mediaContext,
    commonMediaContext,
    notFoundMessage,
    notifyKind,
  } = kind.tables;

  function toDB(
    data: Partial<SharedSpaceInput> & Partial<TExtraInput>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries({ ...sharedToDB(data), ...kind.extraToDB(data) }).filter(
        ([, value]) => value !== undefined,
      ),
    );
  }

  async function queryUserAccesses(
    spaceId: string | null,
  ): Promise<SpaceUserAccess[]> {
    const result = await pool.query<UserAccessRow>(
      `SELECT u.id AS user_id, u.first_name, u.last_name,
              s.id AS space_id, s.name AS space_name, uaa.access_expiry
       FROM Users u
       JOIN ${accessTable} uaa ON u.id = uaa.user_id
       JOIN ${table} s ON s.id = uaa.${accessColumn}
       WHERE (uaa.access_expiry IS NULL OR uaa.access_expiry > NOW())
         AND ($1::uuid IS NULL OR s.id = $1::uuid)
       ORDER BY u.first_name, u.last_name, u.email, s.name ASC`,
      [spaceId],
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      spaceId: row.space_id,
      spaceName: row.space_name,
      accessExpiry: row.access_expiry?.toISOString() ?? null,
    }));
  }

  return {
    async create(data: SharedSpaceInput & TExtraInput): Promise<string> {
      const fields = toDB(data);
      const columns = Object.keys(fields);
      const placeholders = columns.map((_, i) => `$${i + 1}`);

      const res = await pool.query<{ id: string }>(
        `INSERT INTO ${table} (${columns.join(", ")}, created_at, updated_at)
         VALUES (${placeholders.join(", ")}, NOW(), NOW())
         RETURNING id`,
        Object.values(fields),
      );

      return res.rows[0].id;
    },

    async getAll(): Promise<SpaceItemAdminDTO[]> {
      const spaces = await pool.query<{
        id: string;
        name: string;
        is_available: boolean;
      }>(`SELECT id, name, is_available FROM ${table} ORDER BY name ASC`);

      const noUserCounts: { space_id: string; count: number }[] = [];

      const [counts, thumbnails, plans, userCounts] = await Promise.all([
        settle(
          MediaService.getMediaCountsByContext(mediaContext),
          "MediaService.getMediaCountsByContext",
          new Map<string, MediaCount>(),
        ),
        settle(
          MediaService.getSingletonsByContext(mediaContext, "THUMBNAIL"),
          "MediaService.getSingletonsByContext.thumbnail",
          new Map<string, ResourceSingleton>(),
        ),
        settle(
          MediaService.getSingletonsByContext(mediaContext, "PLAN"),
          "MediaService.getSingletonsByContext.plan",
          new Map<string, ResourceSingleton>(),
        ),
        settle(
          pool
            .query<{ space_id: string; count: number }>(
              `SELECT ${accessColumn} AS space_id,
                      COUNT(DISTINCT user_id)::int AS count
               FROM ${accessTable}
               WHERE access_expiry IS NULL OR access_expiry > NOW()
               GROUP BY ${accessColumn}`,
            )
            .then((result) => result.rows),
          "getSpaceUserCounts",
          noUserCounts,
        ),
      ]);

      const userCountMap = new Map(
        userCounts.map((row) => [row.space_id, row.count] as const),
      );

      return spaces.rows.map((space) => {
        const mediaCount = counts.get(space.id);
        const thumbnail = thumbnails.get(space.id);
        const plan = plans.get(space.id);

        return {
          id: space.id,
          name: space.name,
          isAvailable: space.is_available,
          photoCount: mediaCount?.numImages ?? 0,
          videoCount: mediaCount?.numVideos ?? 0,
          thumbnailUrl: thumbnail ? `/media/${thumbnail.id}` : null,
          planType: plan ? plan.type : null,
          planUrl: plan ? `/media/${plan.id}` : null,
          userCount: userCountMap.get(space.id) ?? 0,
        };
      });
    },

    async getById(id: string): Promise<SpaceDetailsAdminDTO<TExtra>> {
      const result = await pool.query<TRow>(
        `SELECT * FROM ${table} WHERE id = $1`,
        [id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundError(notFoundMessage);
      }

      const [counts, thumbnail, plan, userCount] = await Promise.all([
        settle(
          MediaService.getMediaCount(mediaContext, id),
          "MediaService.getMediaCount",
          null,
        ),
        settle(
          MediaService.getSingleton(mediaContext, id, "THUMBNAIL"),
          "MediaService.getSingleton.thumbnail",
          null,
        ),
        settle(
          MediaService.getSingleton(mediaContext, id, "PLAN"),
          "MediaService.getSingleton.plan",
          null,
        ),
        settle(
          pool
            .query<{ count: number }>(
              `SELECT COUNT(DISTINCT user_id)::int AS count
               FROM ${accessTable}
               WHERE ${accessColumn} = $1
                 AND (access_expiry IS NULL OR access_expiry > NOW())`,
              [id],
            )
            .then((r) => r.rows[0].count),
          "getSpaceUserCount",
          0,
        ),
      ]);

      const row = result.rows[0];

      return {
        ...toSpaceBase(row),
        ...kind.extraToDTO(row),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        thumbnailUrl: thumbnail ? `/media/${thumbnail.id}` : null,
        planType: plan ? plan.type : null,
        planUrl: plan ? `/media/${plan.id}` : null,
        photoCount: counts?.numImages ?? 0,
        videoCount: counts?.numVideos ?? 0,
        userCount,
      };
    },

    async update(
      id: string,
      data: Partial<SharedSpaceInput> & Partial<TExtraInput>,
    ): Promise<string> {
      const fields = toDB(data);
      const columns = Object.keys(fields);
      const setClauses = columns.map((col, i) => `${col} = $${i + 1}`);

      const res = await pool.query<{ id: string }>(
        `UPDATE ${table}
         SET ${setClauses.join(", ")}, updated_at = NOW()
         WHERE id = $${columns.length + 1}
         RETURNING id`,
        [...Object.values(fields), id],
      );

      if (res.rowCount === 0) {
        throw new NotFoundError(notFoundMessage);
      }

      return res.rows[0].id;
    },

/**
 * Deletes the space and its media rows in one transaction, then the files
 * and folder after COMMIT (files can't be rolled back, rows can). Access
 * grants go with the space through ON DELETE CASCADE.
 */
    async delete(id: string): Promise<void> {
      const client = await pool.connect();
      let diskPaths: string[] = [];

      try {
        await client.query("BEGIN");

        diskPaths = await AdminMediaService.deleteResourceMediaFilesWithClient(
          client,
          mediaContext,
          id,
        );

        const result = await client.query(
          `DELETE FROM ${table} WHERE id = $1`,
          [id],
        );

        if (result.rowCount === 0) {
          throw new NotFoundError(notFoundMessage);
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch((rollbackErr) => {
          logError(rollbackErr, {
            forceServerError: true,
            operation: "rollbackSpaceDelete",
          });
        });

        throw error;
      } finally {
        client.release();
      }

      await MediaStorageService.cleanupFiles(
        diskPaths.map((diskPath) => ({ diskPath })),
      );
      await MediaStorageService.cleanupFolder(mediaContext, id);
    },

/**
 * Marks a space available or not. When marking it unavailable, can also
 * revoke every existing grant in the same transaction.
 */
    async setAvailability(
      id: string,
      isAvailable: boolean,
      revokeAccesses: boolean,
    ): Promise<void> {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const result = await client.query(
          `UPDATE ${table} SET is_available = $1 WHERE id = $2`,
          [isAvailable, id],
        );

        if (result.rowCount === 0) {
          throw new NotFoundError(notFoundMessage);
        }

        if (!isAvailable && revokeAccesses) {
          await revokeAllAccess(id, client);
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch((rollbackErr) => {
          logError(rollbackErr, {
            forceServerError: true,
            operation: "rollbackSetSpaceAvailability",
          });
        });
        throw err;
      } finally {
        client.release();
      }
    },

    getUsers(spaceId: string): Promise<SpaceUserAccess[]> {
      return queryUserAccesses(spaceId);
    },

    getAllUserAccesses(): Promise<SpaceUserAccess[]> {
      return queryUserAccesses(null);
    },

/**
 * Grants every user access to every listed space in one statement
 * (unnest x unnest, so no bind-parameter limit), updating the expiry of
 * existing grants. Notification emails are sent in the background.
 */
    async grantAccess({
      userIds,
      spaceIds,
      accessExpiry,
    }: SpaceAccessGrant): Promise<void> {
      await pool.query(
        `INSERT INTO ${accessTable} (user_id, ${accessColumn}, access_expiry)
         SELECT u.user_id, s.space_id, $3::timestamptz
         FROM unnest($1::uuid[]) AS u(user_id)
         CROSS JOIN unnest($2::uuid[]) AS s(space_id)
         ON CONFLICT (user_id, ${accessColumn})
         DO UPDATE SET access_expiry = EXCLUDED.access_expiry`,
        [userIds, spaceIds, accessExpiry],
      );

      const users = await pool.query<{ email: string; firstName: string }>(
        `SELECT email, first_name AS "firstName"
         FROM Users WHERE id = ANY($1::uuid[])`,
        [userIds],
      );

      const spaces = await pool.query<{ id: string; name: string }>(
        `SELECT id, name FROM ${table} WHERE id = ANY($1::uuid[])`,
        [spaceIds],
      );

      sendInBackground(
        "sendAccessGrantedEmail",
        notifyAccessGranted(notifyKind, users.rows, spaces.rows),
      );
    },

    async revokeAccess({
      userIds,
      spaceIds,
    }: SpaceAccessRevoke): Promise<void> {
      await pool.query(
        `DELETE FROM ${accessTable}
         WHERE ${accessColumn} = ANY($1::uuid[])
           AND user_id = ANY($2::uuid[])`,
        [spaceIds, userIds],
      );
    },

    async getCommonSpaceMedia(): Promise<CommonSpaceMediaDTO<AdminMediaItem>> {
      const media = await MediaService.getResourceMediaItems(
        commonMediaContext,
        null,
        true,
      );

      return { media };
    },

    async getMediaById(id: string): Promise<SpaceMediaListDTO<AdminMediaItem>> {
      const media = await MediaService.getResourceMediaItems(
        mediaContext,
        id,
        true,
      );

      return { media };
    },
  };

  async function revokeAllAccess(spaceId: string, client: PoolClient) {
    await client.query(
      `DELETE FROM ${accessTable} WHERE ${accessColumn} = $1`,
      [spaceId],
    );
  }
}

export const AdminApartmentService = createAdminSpaceService(apartmentKind);
export const AdminProSpaceService = createAdminSpaceService(proSpaceKind);

import pool from "../../db";
import type { SpaceRow } from "../../models/Space";
import type { CommonSpaceMediaDTO } from "../../types/commonSpace";
import type {
  MediaCount,
  MediaItem,
  ResourceSingleton,
} from "../../types/media";
import type {
  SpaceAccessEntry,
  SpaceDetailsDTO,
  SpaceItemDTO,
  SpaceMediaListDTO,
} from "../../types/space";
import { NotFoundError } from "../../utils/errors/NotFoundError";
import { settle } from "../../utils/settle";
import MediaService from "../MediaService";
import { apartmentKind, proSpaceKind, type SpaceKind } from "./spaceKinds";
import { toSpaceBase } from "./spaceMappers";

interface SpaceListRow {
  id: string;
  name: string;
  type: string;
  size_carrez_sqm: number;
  floor: string;
  orientation: string;
  view: string;
  is_available: boolean;
  access_expiry: Date | null;
  has_access: boolean;
}

/**
 * Public read-side service for one kind of space (apartments or pro
 * spaces). Table and column names come from the fixed kind definition,
 * never from the request, so interpolating them into SQL is safe.
 */
export function createSpaceService<
  TRow extends SpaceRow,
  TExtra extends object,
>(kind: Pick<SpaceKind<TRow, TExtra, object>, "tables" | "extraToDTO">) {
  const {
    table,
    accessTable,
    accessColumn,
    mediaContext,
    commonMediaContext,
    notFoundMessage,
  } = kind.tables;

  return {
/**
 * Public listing. Every space is listed; `hasAccess` and the expiry are
 * filled in for the logged-in user (null userId = anonymous visitor).
 */
    async getAll(userId: string | null): Promise<SpaceItemDTO[]> {
      const result = await pool.query<SpaceListRow>(
        `SELECT a.id, a.name, a.type, a.size_carrez_sqm, a.floor,
                a.orientation, a.view, a.is_available, uaa.access_expiry,
                (uaa.${accessColumn} IS NOT NULL
                  AND (uaa.access_expiry IS NULL OR uaa.access_expiry > NOW())
                ) AS has_access
         FROM ${table} a
         LEFT JOIN ${accessTable} uaa
           ON a.id = uaa.${accessColumn} AND uaa.user_id = $1
         ORDER BY a.name ASC`,
        [userId],
      );

      const [mediaCounts, thumbnails] = await Promise.all([
        settle(
          MediaService.getMediaCountsByContext(mediaContext),
          "MediaService.getMediaCountsByContext",
          new Map<string, MediaCount>(),
        ),
        settle(
          MediaService.getSingletonsByContext(mediaContext, "THUMBNAIL"),
          "MediaService.getSingletonsByContext",
          new Map<string, ResourceSingleton>(),
        ),
      ]);

      return result.rows.map((row) => {
        const counts = mediaCounts.get(row.id);
        const thumbnail = thumbnails.get(row.id);

        return {
          id: row.id,
          name: row.name,
          type: row.type,
          sizeCarrezSqm: row.size_carrez_sqm,
          floor: row.floor,
          orientation: row.orientation,
          view: row.view,
          photoCount: counts?.numImages ?? 0,
          videoCount: counts?.numVideos ?? 0,
          thumbnailUrl: thumbnail ? `/media/${thumbnail.id}` : null,
          isAvailable: row.is_available,
          hasAccess: row.has_access,
          accessExpiry: row.has_access
            ? (row.access_expiry?.toISOString() ?? null)
            : null,
        };
      });
    },

    async getCount(): Promise<number> {
      const result = await pool.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM ${table}`,
      );

      return result.rows[0].count;
    },

    /**
     * Does NOT check access: the authorize middleware does that before this
     * runs. userId is only used to return the caller's own expiry date.
     */
    async getById(
      id: string,
      userId: string,
    ): Promise<SpaceDetailsDTO<TExtra>> {
      const result = await pool.query<TRow & { access_expiry: Date | null }>(
        `SELECT a.*, uaa.access_expiry
         FROM ${table} a
         LEFT JOIN ${accessTable} uaa
           ON a.id = uaa.${accessColumn} AND uaa.user_id = $1
         WHERE a.id = $2`,
        [userId, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundError(notFoundMessage);
      }

      const [counts, thumbnail, plan] = await Promise.all([
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
      ]);

      const row = result.rows[0];

      return {
        ...toSpaceBase(row),
        ...kind.extraToDTO(row),
        photoCount: counts?.numImages ?? 0,
        videoCount: counts?.numVideos ?? 0,
        thumbnailUrl: thumbnail ? `/media/${thumbnail.id}` : null,
        planType: plan ? plan.type : null,
        planUrl: plan ? `/media/${plan.id}` : null,
        accessExpiry: row.access_expiry?.toISOString() ?? null,
      };
    },

    async assertExists(id: string): Promise<void> {
      const result = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1`, [
        id,
      ]);

      if (result.rowCount === 0) {
        throw new NotFoundError(notFoundMessage);
      }
    },

    async getForUser(userId: string): Promise<SpaceAccessEntry[]> {
      const result = await pool.query<{
        id: string;
        name: string;
        access_expiry: Date | null;
      }>(
        `SELECT a.id, a.name, uaa.access_expiry
         FROM ${table} a
         JOIN ${accessTable} uaa ON a.id = uaa.${accessColumn}
         WHERE uaa.user_id = $1
           AND (uaa.access_expiry IS NULL OR uaa.access_expiry > NOW())
         ORDER BY a.name ASC`,
        [userId],
      );

      const thumbnails = await settle(
        MediaService.getSingletonsByContext(mediaContext, "THUMBNAIL"),
        "MediaService.getSingletonsByContext",
        new Map<string, ResourceSingleton>(),
      );

      return result.rows.map((row) => {
        const thumbnail = thumbnails.get(row.id);

        return {
          id: row.id,
          name: row.name,
          thumbnailUrl: thumbnail ? `/media/${thumbnail.id}` : null,
          accessExpiry: row.access_expiry?.toISOString() ?? null,
        };
      });
    },

    async getCommonSpaceMedia(): Promise<CommonSpaceMediaDTO<MediaItem>> {
      const media = await MediaService.getResourceMediaItems(
        commonMediaContext,
        null,
      );

      return { media };
    },

    async getMediaById(id: string): Promise<SpaceMediaListDTO<MediaItem>> {
      const media = await MediaService.getResourceMediaItems(mediaContext, id);

      return { media };
    },
  };
}

export const ApartmentService = createSpaceService(apartmentKind);
export const ProSpaceService = createSpaceService(proSpaceKind);

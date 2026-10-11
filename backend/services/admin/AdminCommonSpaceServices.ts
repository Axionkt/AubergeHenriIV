import pool from "../../db";
import Media from "../../models/Media";
import { CommonSpaceMediaDTO } from "../../types/commonSpace";
import { AdminMediaItem } from "../../types/media";

export default class AdminCommonSpaceServices {
  public static async getCommonSpaceMedia(): Promise<
    CommonSpaceMediaDTO<AdminMediaItem>
  > {
    const commonSpaceMedia = await pool.query<Media>(
      `SELECT *
      FROM Media
      WHERE context = 'common-space'
      ORDER BY display_order ASC`,
    );

    return {
      media: commonSpaceMedia.rows.map((f) => ({
        id: f.id,
        type: f.type,
        url: `/media/${f.id}`,
        sizeBytes: f.size_bytes,
        createdAt: f.created_at.toISOString(),
      })),
    };
  }
}

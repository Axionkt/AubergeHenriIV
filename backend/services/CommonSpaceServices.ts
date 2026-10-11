import pool from "../db";
import { CommonSpaceMediaDTO } from "../types/commonSpace";
import { MediaItem } from "../types/media";

export default class CommonSpaceServices {
  public static async getCommonSpaceMedia(): Promise<
    CommonSpaceMediaDTO<MediaItem>
  > {
    const commonSpaceMedia = await pool.query(
      `SELECT id,
        type
      FROM Media
      WHERE context = 'common-space'
      ORDER BY display_order ASC`,
    );

    return {
      media: commonSpaceMedia.rows.map((f) => ({
        id: f.id,
        type: f.type,
        url: `/media/${f.id}`,
      })),
    };
  }
}

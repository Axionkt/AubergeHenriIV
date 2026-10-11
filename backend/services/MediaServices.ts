import pool from "../db";
import Media from "../models/Media";
import { MediaRow } from "../types/media";
import { NotFoundError } from "../utils/errors/NotFoundError";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";
import { checkMediaAccess } from "../utils/media";

export default class MediaServices {
  public static async getMediaItem(
    mediaId: string,
    user: { sub: string; isAdmin: boolean } | null,
  ): Promise<MediaRow> {
    const result = await pool.query<Media>(
      "SELECT * FROM Media WHERE id = $1",
      [mediaId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundError("Média introuvable.");
    }

    const item = result.rows[0];

    // Thumbnails are always public, even for restricted media, regardless of auth or checkMediaAccess
    if (item.is_thumbnail) {
      return {
        id: item.id,
        filePath: item.file_path,
        mimeType: item.mime_type,
        context: item.context,
      };
    }

    if (!user) {
      throw new UnauthorizedError(
        "Vous devez être connecté pour accéder à ce média.",
      );
    }

    await checkMediaAccess(
      item.context,
      item.context_id,
      user.sub,
      user.isAdmin,
    );

    return {
      id: item.id,
      filePath: item.file_path,
      mimeType: item.mime_type,
      context: item.context,
    };
  }
}

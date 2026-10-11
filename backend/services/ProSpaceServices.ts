import pool from "../db";
import ProSpace from "../models/ProSpace";
import Media from "../models/Media";
import UserProSpaceAccess from "../models/UserProSpaceAccess";
import { MediaItem } from "../types/media";
import { UserProSpaceAccessDTO } from "../types/userAccess";
import { NotFoundError } from "../utils/errors/NotFoundError";
import { ProSpaceDetailsDTO, ProSpaceItemDTO } from "../types/proSpace";

export default class ProSpaceServices {
  public static async getAllProSpaces(
    userId: string | null,
  ): Promise<ProSpaceItemDTO[]> {
    const spaces = await pool.query<
      ProSpace &
        UserProSpaceAccess & {
          has_access: boolean;
          photo_count: number;
          video_count: number;
          thumbnail_media_id: string | null;
        }
    >(
      `SELECT a.*,
        upsa.*,
        (upsa.pro_space_id IS NOT NULL
          AND (upsa.access_expiry IS NULL OR upsa.access_expiry > NOW())
        ) AS has_access,
        COUNT(m.id) FILTER (WHERE m.type = 'image' AND m.is_thumbnail = FALSE) AS photo_count,
        COUNT(m.id) FILTER (WHERE m.type = 'video') AS video_count,
        (SELECT id FROM Media 
          WHERE context = 'pro-space' 
            AND context_id = a.id 
            AND is_thumbnail = TRUE 
          LIMIT 1) AS thumbnail_media_id
      FROM ProSpaces a
      LEFT JOIN UserProSpaceAccess upsa
        ON a.id = upsa.pro_space_id AND upsa.user_id = $1
      LEFT JOIN Media m ON m.context = 'pro-space'
        AND m.context_id = a.id
        AND m.is_thumbnail = FALSE
      GROUP BY a.id, upsa.user_id, upsa.pro_space_id
      ORDER BY a.name ASC`,
      [userId],
    );

    return spaces.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      sizeCarrezSqm: row.size_carrez_sqm,
      floor: row.floor,
      orientation: row.orientation,
      view: row.view,
      photoCount: row.photo_count,
      videoCount: row.video_count,
      thumbnailUrl: row.thumbnail_media_id
        ? `/media/${row.thumbnail_media_id}`
        : null,
      isAvailable: row.is_available,
      hasAccess: row.has_access,
      accessExpiry: row.has_access
        ? (row.access_expiry?.toISOString() ?? null)
        : null,
    }));
  }

  public static async getProSpaceById(
    id: string,
    userId: string,
  ): Promise<ProSpaceDetailsDTO> {
    const space = await pool.query<
      ProSpace &
        UserProSpaceAccess & {
          photo_count: number;
          video_count: number;
          thumbnail_media_id: string | null;
        }
    >(
      `SELECT a.*,
      upsa.*,
      COUNT(m.id) FILTER (WHERE m.type = 'image' AND m.is_thumbnail = FALSE) AS photo_count,
      COUNT(m.id) FILTER (WHERE m.type = 'video') AS video_count,
      (SELECT id FROM Media 
        WHERE context = 'pro-space' 
          AND context_id = a.id 
          AND is_thumbnail = TRUE 
        LIMIT 1) AS thumbnail_media_id
      FROM ProSpaces a
      LEFT JOIN UserProSpaceAccess upsa ON a.id = upsa.pro_space_id AND upsa.user_id = $1
      LEFT JOIN Media m ON m.context = 'pro-space'
        AND m.context_id = a.id
        AND m.is_thumbnail = FALSE
      WHERE a.id = $2
        AND (upsa.access_expiry > NOW() OR upsa.access_expiry IS NULL)
      GROUP BY a.id, upsa.user_id, upsa.pro_space_id`,
      [userId, id],
    );

    if (space.rowCount === 0) {
      throw new NotFoundError("Espace pro introuvable.");
    }

    return {
      id: space.rows[0].id,
      name: space.rows[0].name,
      description: space.rows[0].description,
      type: space.rows[0].type,
      sizeCarrezSqm: space.rows[0].size_carrez_sqm,
      sizeFloorSqm: space.rows[0].size_floor_sqm,
      floor: space.rows[0].floor,
      orientation: space.rows[0].orientation,
      view: space.rows[0].view,
      hasPrivateExterior: space.rows[0].has_private_exterior,
      electricHeatingModel: space.rows[0].electric_heating_model,
      bathroomTowelHeaterModel: space.rows[0].bathroom_towel_heater_model,
      electricWaterHeaterModel: space.rows[0].electric_water_heater_model,
      kitchenCabinetsModel: space.rows[0].kitchen_cabinets_model,
      dpeEnergyRating: space.rows[0].dpe_energy_rating,
      dpeEnergyKwhPerSqmYear: space.rows[0].dpe_energy_kwh_per_sqm_year,
      dpeEmissionsRating: space.rows[0].dpe_emissions_rating,
      dpeEmissionsKgPerSqmYear: space.rows[0].dpe_emissions_kg_per_sqm_year,
      previousTenantAnnualConsumptionEur:
        space.rows[0].previous_tenant_annual_consumption_eur,
      hasDoubleGlazedWindows: space.rows[0].has_double_glazed_windows,
      meterPowerKva: space.rows[0].meter_power_kva,
      deliveryPointId: space.rows[0].delivery_point_id,
      hasFiberOptic: space.rows[0].has_fiber_optic,
      hasCopperNetwork: space.rows[0].has_copper_network,
      hasTvOutlet: space.rows[0].has_tv_outlet,
      landRegistryRefPre2025: space.rows[0].land_registry_ref_pre_2025,
      landRegistryRefPost2025: space.rows[0].land_registry_ref_post_2025,
      photoCount: space.rows[0].photo_count,
      videoCount: space.rows[0].video_count,
      thumbnailUrl: space.rows[0].thumbnail_media_id
        ? `/media/${space.rows[0].thumbnail_media_id}`
        : null,
      isAvailable: space.rows[0].is_available,
      accessExpiry: space.rows[0].access_expiry?.toISOString() ?? null,
    };
  }

  public static async getProSpaceMediaById(
    id: string,
  ): Promise<{ media: MediaItem[] }> {
    const spaceMedia = await pool.query<Media>(
      `SELECT *
      FROM Media
      WHERE context = 'pro-space'
        AND context_id = $1
        AND is_thumbnail = FALSE
      ORDER BY display_order ASC`,
      [id],
    );

    return {
      media: spaceMedia.rows.map((f) => ({
        id: f.id,
        type: f.type,
        url: `/media/${f.id}`,
      })),
    };
  }

  public static async getProSpacesForUser(
    userId: string,
  ): Promise<UserProSpaceAccessDTO[]> {
    const res = await pool.query<
      ProSpace & UserProSpaceAccess & { thumbnail_media_id: string | null }
    >(
      `SELECT a.*,
        m.id as thumbnail_media_id,
        upsa.*
      FROM ProSpaces a
      LEFT JOIN Media m ON m.context = 'pro-space'
        AND a.id = m.context_id
        AND m.is_thumbnail = true
      JOIN UserProSpaceAccess upsa ON a.id = upsa.pro_space_id
      WHERE upsa.user_id = $1
        AND (upsa.access_expiry > NOW() OR upsa.access_expiry IS NULL)
      ORDER BY a.name ASC`,
      [userId],
    );

    return res.rows.map((row) => ({
      proSpaceId: row.id,
      proSpaceName: row.name,
      proSpaceThumbnailUrl: row.thumbnail_media_id
        ? `/media/${row.thumbnail_media_id}`
        : null,
      accessExpiry: row.access_expiry?.toISOString() ?? null,
    }));
  }
}

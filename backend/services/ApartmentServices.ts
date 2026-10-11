import pool from "../db";
import Apartment from "../models/Apartment";
import Media from "../models/Media";
import UserApartmentAccess from "../models/UserApartmentAccess";
import {
  ApartmentMediaListDTO,
  ApartmentDetailsDTO,
  ApartmentItemDTO,
} from "../types/apartment";
import { MediaItem } from "../types/media";
import { UserApartmentAccessDTO } from "../types/userAccess";
import { NotFoundError } from "../utils/errors/NotFoundError";

export default class ApartmentServices {
  public static async getAllApartments(
    userId: string | null,
  ): Promise<ApartmentItemDTO[]> {
    const apts = await pool.query<
      Apartment &
        UserApartmentAccess & {
          has_access: boolean;
          photo_count: number;
          video_count: number;
          thumbnail_media_id: string | null;
        }
    >(
      `SELECT a.*,
        uaa.*,
        (uaa.apartment_id IS NOT NULL
          AND (uaa.access_expiry IS NULL OR uaa.access_expiry > NOW())
        ) AS has_access,
        COUNT(m.id) FILTER (WHERE m.type = 'image' AND m.is_thumbnail = FALSE) AS photo_count,
        COUNT(m.id) FILTER (WHERE m.type = 'video') AS video_count,
        (SELECT id FROM Media 
          WHERE context = 'apartment' 
            AND context_id = a.id 
            AND is_thumbnail = TRUE 
          LIMIT 1) AS thumbnail_media_id
      FROM Apartments a
      LEFT JOIN UserApartmentAccess uaa
        ON a.id = uaa.apartment_id AND uaa.user_id = $1
      LEFT JOIN Media m ON m.context = 'apartment'
        AND m.context_id = a.id
        AND m.is_thumbnail = FALSE
      GROUP BY a.id, uaa.user_id, uaa.apartment_id
      ORDER BY a.name ASC`,
      [userId],
    );

    return apts.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
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

  public static async getApartmentById(
    id: string,
    userId: string,
  ): Promise<ApartmentDetailsDTO> {
    const apt = await pool.query<
      Apartment &
        UserApartmentAccess & {
          photo_count: number;
          video_count: number;
          thumbnail_media_id: string | null;
        }
    >(
      `SELECT a.*,
      uaa.*,
      COUNT(m.id) FILTER (WHERE m.type = 'image' AND m.is_thumbnail = FALSE) AS photo_count,
      COUNT(m.id) FILTER (WHERE m.type = 'video') AS video_count,
      (SELECT id FROM Media 
        WHERE context = 'apartment' 
          AND context_id = a.id 
          AND is_thumbnail = TRUE 
        LIMIT 1) AS thumbnail_media_id
      FROM Apartments a
      LEFT JOIN UserApartmentAccess uaa ON a.id = uaa.apartment_id AND uaa.user_id = $1
      LEFT JOIN Media m ON m.context = 'apartment'
        AND m.context_id = a.id
        AND m.is_thumbnail = FALSE
      WHERE a.id = $2
        AND (uaa.access_expiry > NOW() OR uaa.access_expiry IS NULL)
      GROUP BY a.id, uaa.user_id, uaa.apartment_id`,
      [userId, id],
    );

    if (apt.rowCount === 0) {
      throw new NotFoundError("Appartement introuvable.");
    }

    return {
      id: apt.rows[0].id,
      name: apt.rows[0].name,
      description: apt.rows[0].description,
      type: apt.rows[0].type,
      sizeCarrezSqm: apt.rows[0].size_carrez_sqm,
      sizeFloorSqm: apt.rows[0].size_floor_sqm,
      floor: apt.rows[0].floor,
      orientation: apt.rows[0].orientation,
      view: apt.rows[0].view,
      hasPrivateExterior: apt.rows[0].has_private_exterior,
      electricHeatingModel: apt.rows[0].electric_heating_model,
      bathroomTowelHeaterModel: apt.rows[0].bathroom_towel_heater_model,
      electricWaterHeaterModel: apt.rows[0].electric_water_heater_model,
      inductionCooktopModel: apt.rows[0].induction_cooktop_model,
      ovenModel: apt.rows[0].oven_model,
      rangeHoodModel: apt.rows[0].range_hood_model,
      kitchenCabinetsModel: apt.rows[0].kitchen_cabinets_model,
      dpeEnergyRating: apt.rows[0].dpe_energy_rating,
      dpeEnergyKwhPerSqmYear: apt.rows[0].dpe_energy_kwh_per_sqm_year,
      dpeEmissionsRating: apt.rows[0].dpe_emissions_rating,
      dpeEmissionsKgPerSqmYear: apt.rows[0].dpe_emissions_kg_per_sqm_year,
      previousTenantAnnualConsumptionEur:
        apt.rows[0].previous_tenant_annual_consumption_eur,
      hasDoubleGlazedWindows: apt.rows[0].has_double_glazed_windows,
      meterPowerKva: apt.rows[0].meter_power_kva,
      deliveryPointId: apt.rows[0].delivery_point_id,
      hasFiberOptic: apt.rows[0].has_fiber_optic,
      hasCopperNetwork: apt.rows[0].has_copper_network,
      hasTvOutlet: apt.rows[0].has_tv_outlet,
      landRegistryRefPre2025: apt.rows[0].land_registry_ref_pre_2025,
      landRegistryRefPost2025: apt.rows[0].land_registry_ref_post_2025,
      photoCount: apt.rows[0].photo_count,
      videoCount: apt.rows[0].video_count,
      thumbnailUrl: apt.rows[0].thumbnail_media_id
        ? `/media/${apt.rows[0].thumbnail_media_id}`
        : null,
      isAvailable: apt.rows[0].is_available,
      accessExpiry: apt.rows[0].access_expiry?.toISOString() ?? null,
    };
  }

  public static async getApartmentMediaById(
    id: string,
  ): Promise<ApartmentMediaListDTO<MediaItem>> {
    const aptMedia = await pool.query<Media>(
      `SELECT *
      FROM Media
      WHERE context = 'apartment'
        AND context_id = $1
        AND is_thumbnail = FALSE
      ORDER BY display_order ASC`,
      [id],
    );

    return {
      media: aptMedia.rows.map((f) => ({
        id: f.id,
        type: f.type,
        url: `/media/${f.id}`,
      })),
    };
  }

  public static async getApartmentsForUser(
    userId: string,
  ): Promise<UserApartmentAccessDTO[]> {
    const res = await pool.query<
      Apartment & UserApartmentAccess & { thumbnail_media_id: string | null }
    >(
      `SELECT a.*,
        m.id as thumbnail_media_id,
        uaa.*
      FROM Apartments a
      LEFT JOIN Media m ON m.context = 'apartment'
        AND a.id = m.context_id
        AND m.is_thumbnail = true
      JOIN UserApartmentAccess uaa ON a.id = uaa.apartment_id
      WHERE uaa.user_id = $1
          AND (uaa.access_expiry > NOW() OR uaa.access_expiry IS NULL)
      ORDER BY a.name ASC`,
      [userId],
    );

    return res.rows.map((row) => ({
      apartmentId: row.id,
      apartmentName: row.name,
      apartmentThumbnailUrl: row.thumbnail_media_id
        ? `/media/${row.thumbnail_media_id}`
        : null,
      accessExpiry: row.access_expiry?.toISOString() ?? null,
    }));
  }
}

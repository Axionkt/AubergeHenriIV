import pool from "../../db";
import { BadRequestError } from "../../utils/errors/BadRequestError";
import { NotFoundError } from "../../utils/errors/NotFoundError";
import {
  ApartmentDetailsAdminDTO,
  ApartmentMediaListDTO,
  ApartmentBaseAdminDTO,
  ApartmentItemAdminDTO,
} from "../../types/apartment";
import { AdminMediaItem } from "../../types/media";
import Apartment from "../../models/Apartment";
import Media from "../../models/Media";
import { UserApartmentAccessAdminDTO } from "../../types/userAccess";
import User from "../../models/User";
import UserApartmentAccess from "../../models/UserApartmentAccess";
import MediaStorageServices from "../MediaStorageServices";
import { toParisNextDayMidnightUTC } from "../../utils/time";
import { PoolClient } from "pg";
import {
  ValidatedCreateApartmentRequest,
  ValidatedUpdateApartmentRequest,
} from "../../schemas/apartment";
import {
  UserApartmentAccessRequest,
  UserApartmentRevokeRequest,
} from "../../schemas/userAccess";
import { sendApartmentAccessGrantedEmail } from "../../utils/email";

export default class AdminApartmentServices {
  public static async createApartment(
    apartmentData: ValidatedCreateApartmentRequest,
  ): Promise<string> {
    const fields = AdminApartmentServices.toDB(apartmentData);
    const columns = Object.keys(fields);
    const values = Object.values(fields);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const res = await pool.query<Apartment>(
      `INSERT INTO Apartments (${columns.join(", ")}, created_at, updated_at)
       VALUES (${placeholders.join(", ")}, NOW(), NOW())
       RETURNING id`,
      values,
    );

    return res.rows[0].id;
  }

  public static async getApartmentById(
    id: string,
  ): Promise<ApartmentDetailsAdminDTO> {
    const apt = await pool.query<
      Apartment & {
        photo_count: number;
        video_count: number;
        thumbnail_media_id: string | null;
      }
    >(
      `SELECT a.*,
        COUNT(m.id) FILTER (WHERE m.type = 'image' AND m.is_thumbnail = FALSE) AS photo_count,
        COUNT(m.id) FILTER (WHERE m.type = 'video') AS video_count,
        (SELECT id FROM Media 
          WHERE context = 'apartment' 
            AND context_id = a.id 
            AND is_thumbnail = TRUE 
          LIMIT 1) AS thumbnail_media_id
      FROM Apartments a
      LEFT JOIN Media m ON m.context = 'apartment'
        AND m.context_id = a.id
        AND m.is_thumbnail = FALSE
      WHERE a.id = $1
      GROUP BY a.id`,
      [id],
    );

    if (apt.rowCount === 0) {
      throw new NotFoundError("Appartement introuvable.");
    }

    const userCount = await pool.query(
      `SELECT COUNT(DISTINCT user_id) 
      FROM UserApartmentAccess
      WHERE apartment_id = $1
        AND (access_expiry > NOW() OR access_expiry IS NULL)`,
      [id],
    );

    return {
      ...AdminApartmentServices.toDTO(apt.rows[0]),
      thumbnailUrl: apt.rows[0].thumbnail_media_id
        ? `/media/${apt.rows[0].thumbnail_media_id}`
        : null,
      photoCount: apt.rows[0].photo_count,
      videoCount: apt.rows[0].video_count,
      userCount: userCount.rows[0].count,
    };
  }

  public static async getApartmentMediaById(
    id: string,
  ): Promise<ApartmentMediaListDTO<AdminMediaItem>> {
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
        sizeBytes: f.size_bytes,
        createdAt: f.created_at.toISOString(),
      })),
    };
  }

  public static async updateApartmentDetails(
    id: string,
    details: ValidatedUpdateApartmentRequest,
  ): Promise<string> {
    const fields = AdminApartmentServices.toDB(details);
    const columns = Object.keys(fields);
    const values = Object.values(fields);

    if (columns.length === 0) {
      throw new BadRequestError("Aucun champ à mettre à jour.");
    }

    const setClauses = columns.map((col, i) => `${col} = $${i + 1}`);

    const res = await pool.query<Apartment>(
      `UPDATE Apartments
       SET ${setClauses.join(", ")}, updated_at = NOW()
       WHERE id = $${columns.length + 1}
       RETURNING id`,
      [...values, id],
    );

    if (res.rowCount === 0) {
      throw new NotFoundError("Appartement introuvable.");
    }

    return res.rows[0].id;
  }

  public static async deleteApartment(id: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM Media WHERE context = 'apartment' AND context_id = $1`,
        [id],
      );

      const deleteRes = await client.query(
        `DELETE FROM Apartments WHERE id = $1`,
        [id],
      );

      if (deleteRes.rowCount === 0) {
        throw new NotFoundError("Appartement introuvable.");
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    await MediaStorageServices.cleanupFolder("apartment", id);
  }

  public static async setAvailability(
    id: string,
    isAvailable: boolean,
    revokeAccesses: boolean,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE Apartments SET is_available = $1 WHERE id = $2`,
        [isAvailable, id],
      );

      if (!isAvailable && revokeAccesses) {
        await this.revokeAllAccessFromApartment(id, client);
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  public static async getAllApartments(): Promise<ApartmentItemAdminDTO[]> {
    const apts = await pool.query<
      Apartment & {
        photo_count: number;
        video_count: number;
        thumbnail_media_id: string | null;
      }
    >(
      `SELECT a.*,
        COUNT(m.id) FILTER (WHERE m.type = 'image' AND m.is_thumbnail = FALSE) AS photo_count,
        COUNT(m.id) FILTER (WHERE m.type = 'video') AS video_count,
        (SELECT id FROM Media 
          WHERE context = 'apartment' 
            AND context_id = a.id 
            AND is_thumbnail = TRUE 
          LIMIT 1) AS thumbnail_media_id
      FROM Apartments a
      LEFT JOIN Media m ON m.context = 'apartment'
        AND m.context_id = a.id
        AND m.is_thumbnail = FALSE
      GROUP BY a.id
      ORDER BY a.name ASC`,
    );

    const userCount = await pool.query(
      `SELECT apartment_id, 
        COUNT(DISTINCT user_id)
      FROM UserApartmentAccess
      WHERE access_expiry > NOW()
      GROUP BY apartment_id`,
    );

    return apts.rows.map((row) => ({
      id: row.id,
      name: row.name,
      isAvailable: row.is_available,
      photoCount: row.photo_count,
      videoCount: row.video_count,
      thumbnailUrl: row.thumbnail_media_id
        ? `/media/${row.thumbnail_media_id}`
        : null,
      userCount:
        userCount.rows.find((uc) => uc.apartment_id === row.id)?.count ?? 0,
    }));
  }

  public static async getApartmentUsers(
    apartmentId: string,
  ): Promise<UserApartmentAccessAdminDTO[]> {
    const res = await pool.query<User & UserApartmentAccess & Apartment>(
      `SELECT *
      FROM Users u
      JOIN UserApartmentAccess aa ON u.id = aa.user_id
      JOIN Apartments a ON aa.apartment_id = a.id
      WHERE aa.apartment_id = $1 AND (aa.access_expiry > NOW() OR aa.access_expiry IS NULL)
      ORDER BY u.first_name, u.last_name, u.email ASC`,
      [apartmentId],
    );

    return res.rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      apartmentId: row.apartment_id,
      apartmentName: row.name,
      accessExpiry: row.access_expiry?.toISOString() ?? null,
    }));
  }

  public static async giveUsersAccessToApartment(
    accessRequest: UserApartmentAccessRequest,
  ): Promise<void> {
    if (
      !accessRequest.userIds?.length ||
      !accessRequest.apartmentIds?.length ||
      accessRequest.accessExpiry === undefined
    ) {
      throw new BadRequestError(
        "Veuillez remplir tous les champs obligatoires.",
      );
    }

    let expiry: string | null = null;

    if (accessRequest.accessExpiry !== null) {
      expiry = toParisNextDayMidnightUTC(accessRequest.accessExpiry);

      const expiryDate = new Date(expiry);

      if (isNaN(expiryDate.getTime())) {
        throw new BadRequestError(
          "Le format de la date d'expiration d'accès est invalide.",
        );
      }

      if (expiryDate.getTime() <= Date.now()) {
        throw new BadRequestError(
          "La date d'expiration d'accès doit être dans le futur.",
        );
      }
    }

    accessRequest.accessExpiry = expiry;

    const values = accessRequest.userIds.flatMap((userId) =>
      accessRequest.apartmentIds.map((apartmentId) => [
        userId,
        apartmentId,
        accessRequest.accessExpiry,
      ]),
    );

    const placeholders = values
      .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
      .join(", ");

    await pool.query(
      `INSERT INTO UserApartmentAccess (user_id, apartment_id, access_expiry)
      VALUES ${placeholders}
      ON CONFLICT (user_id, apartment_id)
      DO UPDATE SET access_expiry = EXCLUDED.access_expiry`,
      values.flat(),
    );

    const userInfo = await pool.query<{ email: string; firstName: string }>(
      `SELECT u.email, u.first_name as "firstName"
      FROM Users u
      WHERE u.id = ANY($1)`,
      [accessRequest.userIds],
    );

    const apartmentInfo = await pool.query<{ id: string; name: string }>(
      `SELECT a.id, a.name
      FROM Apartments a
      WHERE a.id = ANY($1)`,
      [accessRequest.apartmentIds],
    );

    sendApartmentAccessGrantedEmail(userInfo.rows, apartmentInfo.rows);
  }

  public static async revokeUsersAccessFromApartment(
    accessRequest: UserApartmentRevokeRequest,
  ): Promise<void> {
    if (!accessRequest.userIds?.length || !accessRequest.apartmentIds?.length)
      return;

    await pool.query(
      `DELETE FROM UserApartmentAccess 
        WHERE apartment_id = ANY($1) 
        AND user_id = ANY($2)`,
      [accessRequest.apartmentIds, accessRequest.userIds],
    );
  }

  private static async revokeAllAccessFromApartment(
    apartmentId: string,
    client: PoolClient,
  ) {
    await client.query(
      `DELETE FROM UserApartmentAccess WHERE apartment_id = $1`,
      [apartmentId],
    );
  }

  public static async getAllUserAccesses(): Promise<
    UserApartmentAccessAdminDTO[]
  > {
    const res = await pool.query<User & UserApartmentAccess & Apartment>(
      `SELECT *
      FROM Users u
      JOIN UserApartmentAccess aa ON u.id = aa.user_id
      JOIN Apartments a ON aa.apartment_id = a.id
      WHERE aa.access_expiry > NOW() OR aa.access_expiry IS NULL
      ORDER BY u.first_name, u.last_name, u.email, a.name ASC`,
    );

    return res.rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      apartmentId: row.apartment_id,
      apartmentName: row.name,
      accessExpiry: row.access_expiry?.toISOString() ?? null,
    }));
  }

  private static toDB(
    data: ValidatedCreateApartmentRequest | ValidatedUpdateApartmentRequest,
  ): Record<string, unknown> {
    const fieldMap: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      type: data.type,
      size_carrez_sqm: data.sizeCarrezSqm,
      size_floor_sqm: data.sizeFloorSqm,
      floor: data.floor,
      orientation: data.orientation,
      view: data.view,
      has_private_exterior: data.hasPrivateExterior,
      electric_heating_model: data.electricHeatingModel,
      bathroom_towel_heater_model: data.bathroomTowelHeaterModel,
      electric_water_heater_model: data.electricWaterHeaterModel,
      induction_cooktop_model: data.inductionCooktopModel,
      oven_model: data.ovenModel,
      range_hood_model: data.rangeHoodModel,
      kitchen_cabinets_model: data.kitchenCabinetsModel,
      dpe_energy_rating: data.dpeEnergyRating,
      dpe_energy_kwh_per_sqm_year: data.dpeEnergyKwhPerSqmYear,
      dpe_emissions_rating: data.dpeEmissionsRating,
      dpe_emissions_kg_per_sqm_year: data.dpeEmissionsKgPerSqmYear,
      previous_tenant_annual_consumption_eur:
        data.previousTenantAnnualConsumptionEur,
      has_double_glazed_windows: data.hasDoubleGlazedWindows,
      meter_power_kva: data.meterPowerKva,
      delivery_point_id: data.deliveryPointId,
      has_fiber_optic: data.hasFiberOptic,
      has_copper_network: data.hasCopperNetwork,
      has_tv_outlet: data.hasTvOutlet,
      land_registry_ref_pre_2025: data.landRegistryRefPre2025,
      land_registry_ref_post_2025: data.landRegistryRefPost2025,
    };

    return Object.fromEntries(
      Object.entries(fieldMap).filter(([, value]) => value !== undefined),
    );
  }

  private static toDTO(row: Apartment): ApartmentBaseAdminDTO {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isAvailable: row.is_available,
      type: row.type,
      sizeCarrezSqm: row.size_carrez_sqm,
      sizeFloorSqm: row.size_floor_sqm,
      floor: row.floor,
      orientation: row.orientation,
      view: row.view,
      hasPrivateExterior: row.has_private_exterior,
      electricHeatingModel: row.electric_heating_model,
      bathroomTowelHeaterModel: row.bathroom_towel_heater_model,
      electricWaterHeaterModel: row.electric_water_heater_model,
      inductionCooktopModel: row.induction_cooktop_model,
      ovenModel: row.oven_model,
      rangeHoodModel: row.range_hood_model,
      kitchenCabinetsModel: row.kitchen_cabinets_model,
      dpeEnergyRating: row.dpe_energy_rating,
      dpeEnergyKwhPerSqmYear: row.dpe_energy_kwh_per_sqm_year,
      dpeEmissionsRating: row.dpe_emissions_rating,
      dpeEmissionsKgPerSqmYear: row.dpe_emissions_kg_per_sqm_year,
      previousTenantAnnualConsumptionEur:
        row.previous_tenant_annual_consumption_eur,
      hasDoubleGlazedWindows: row.has_double_glazed_windows,
      meterPowerKva: row.meter_power_kva,
      deliveryPointId: row.delivery_point_id,
      hasFiberOptic: row.has_fiber_optic,
      hasCopperNetwork: row.has_copper_network,
      hasTvOutlet: row.has_tv_outlet,
      landRegistryRefPre2025: row.land_registry_ref_pre_2025,
      landRegistryRefPost2025: row.land_registry_ref_post_2025,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}

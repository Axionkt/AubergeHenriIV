import pool from "../../db";
import { BadRequestError } from "../../utils/errors/BadRequestError";
import { NotFoundError } from "../../utils/errors/NotFoundError";
import {
  ProSpaceDetailsAdminDTO,
  ProSpaceMediaListDTO,
  ProSpaceBaseAdminDTO,
  ProSpaceItemAdminDTO,
} from "../../types/proSpace";
import { AdminMediaItem } from "../../types/media";
import ProSpace from "../../models/ProSpace";
import Media from "../../models/Media";
import { UserProSpaceAccessAdminDTO } from "../../types/userAccess";
import User from "../../models/User";
import UserProSpaceAccess from "../../models/UserProSpaceAccess";
import MediaStorageServices from "../MediaStorageServices";
import { toParisNextDayMidnightUTC } from "../../utils/time";
import { PoolClient } from "pg";
import {
  ValidatedCreateProSpaceRequest,
  ValidatedUpdateProSpaceRequest,
} from "../../schemas/proSpace";
import {
  UserProSpaceAccessRequest,
  UserProSpaceRevokeRequest,
} from "../../schemas/userAccess";

export default class AdminProSpaceServices {
  public static async createProSpace(
    proSpaceData: ValidatedCreateProSpaceRequest,
  ): Promise<string> {
    const fields = AdminProSpaceServices.toDB(proSpaceData);
    const columns = Object.keys(fields);
    const values = Object.values(fields);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const res = await pool.query<ProSpace>(
      `INSERT INTO ProSpaces (${columns.join(", ")}, created_at, updated_at)
       VALUES (${placeholders.join(", ")}, NOW(), NOW())
       RETURNING id`,
      values,
    );

    return res.rows[0].id;
  }

  public static async getProSpaceById(
    id: string,
  ): Promise<ProSpaceDetailsAdminDTO> {
    const space = await pool.query<
      ProSpace & {
        photo_count: number;
        video_count: number;
        thumbnail_media_id: string | null;
      }
    >(
      `SELECT a.*,
        COUNT(m.id) FILTER (WHERE m.type = 'image' AND m.is_thumbnail = FALSE) AS photo_count,
        COUNT(m.id) FILTER (WHERE m.type = 'video') AS video_count,
        (SELECT id FROM Media 
          WHERE context = 'pro-space' 
            AND context_id = a.id 
            AND is_thumbnail = TRUE 
          LIMIT 1) AS thumbnail_media_id
      FROM ProSpaces a
      LEFT JOIN Media m ON m.context = 'pro-space'
        AND m.context_id = a.id
        AND m.is_thumbnail = FALSE
      WHERE a.id = $1
      GROUP BY a.id`,
      [id],
    );

    if (space.rowCount === 0) {
      throw new NotFoundError("Espace pro introuvable.");
    }

    const userCount = await pool.query(
      `SELECT COUNT(DISTINCT user_id) 
      FROM UserProSpaceAccess
      WHERE pro_space_id = $1
        AND (access_expiry > NOW() OR access_expiry IS NULL)`,
      [id],
    );

    return {
      ...AdminProSpaceServices.toDTO(space.rows[0]),
      thumbnailUrl: space.rows[0].thumbnail_media_id
        ? `/media/${space.rows[0].thumbnail_media_id}`
        : null,
      photoCount: space.rows[0].photo_count,
      videoCount: space.rows[0].video_count,
      userCount: userCount.rows[0].count,
    };
  }

  public static async getProSpaceMediaById(
    id: string,
  ): Promise<ProSpaceMediaListDTO<AdminMediaItem>> {
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
        sizeBytes: f.size_bytes,
        createdAt: f.created_at.toISOString(),
      })),
    };
  }

  public static async updateProSpaceDetails(
    id: string,
    details: ValidatedUpdateProSpaceRequest,
  ): Promise<string> {
    const fields = AdminProSpaceServices.toDB(details);
    const columns = Object.keys(fields);
    const values = Object.values(fields);

    if (columns.length === 0) {
      throw new BadRequestError("Aucun champ à mettre à jour.");
    }

    const setClauses = columns.map((col, i) => `${col} = $${i + 1}`);

    const res = await pool.query<ProSpace>(
      `UPDATE ProSpaces
       SET ${setClauses.join(", ")}, updated_at = NOW()
       WHERE id = $${columns.length + 1}
       RETURNING id`,
      [...values, id],
    );

    if (res.rowCount === 0) {
      throw new NotFoundError("Espace pro introuvable.");
    }

    return res.rows[0].id;
  }

  public static async deleteProSpace(id: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM Media WHERE context = 'pro-space' AND context_id = $1`,
        [id],
      );

      const deleteRes = await client.query(
        `DELETE FROM ProSpaces WHERE id = $1`,
        [id],
      );

      if (deleteRes.rowCount === 0) {
        throw new NotFoundError("Espace pro introuvable.");
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    await MediaStorageServices.cleanupFolder("pro-space", id);
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
        `UPDATE ProSpaces SET is_available = $1 WHERE id = $2`,
        [isAvailable, id],
      );

      if (!isAvailable && revokeAccesses) {
        await this.revokeAllAccessFromProSpace(id, client);
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  public static async getAllProSpaces(): Promise<ProSpaceItemAdminDTO[]> {
    const spaces = await pool.query<
      ProSpace & {
        photo_count: number;
        video_count: number;
        thumbnail_media_id: string | null;
      }
    >(
      `SELECT a.*,
        COUNT(m.id) FILTER (WHERE m.type = 'image' AND m.is_thumbnail = FALSE) AS photo_count,
        COUNT(m.id) FILTER (WHERE m.type = 'video') AS video_count,
        (SELECT id FROM Media 
          WHERE context = 'pro-space' 
            AND context_id = a.id 
            AND is_thumbnail = TRUE 
          LIMIT 1) AS thumbnail_media_id
      FROM ProSpaces a
      LEFT JOIN Media m ON m.context = 'pro-space'
        AND m.context_id = a.id
        AND m.is_thumbnail = FALSE
      GROUP BY a.id
      ORDER BY a.name ASC`,
    );

    const userCount = await pool.query(
      `SELECT pro_space_id, 
        COUNT(DISTINCT user_id)
      FROM UserProSpaceAccess
      WHERE access_expiry > NOW()
      GROUP BY pro_space_id`,
    );

    return spaces.rows.map((row) => ({
      id: row.id,
      name: row.name,
      isAvailable: row.is_available,
      photoCount: row.photo_count,
      videoCount: row.video_count,
      thumbnailUrl: row.thumbnail_media_id
        ? `/media/${row.thumbnail_media_id}`
        : null,
      userCount:
        userCount.rows.find((uc) => uc.pro_space_id === row.id)?.count ?? 0,
    }));
  }

  public static async getProSpaceUsers(
    proSpaceId: string,
  ): Promise<UserProSpaceAccessAdminDTO[]> {
    const res = await pool.query<User & UserProSpaceAccess & ProSpace>(
      `SELECT *
      FROM Users u
      JOIN UserProSpaceAccess upsa ON u.id = upsa.user_id
      JOIN ProSpaces a ON upsa.pro_space_id = a.id
      WHERE upsa.pro_space_id = $1 AND (upsa.access_expiry > NOW() OR upsa.access_expiry IS NULL)
      ORDER BY u.first_name, u.last_name, u.email ASC`,
      [proSpaceId],
    );

    return res.rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      proSpaceId: row.pro_space_id,
      proSpaceName: row.name,
      accessExpiry: row.access_expiry?.toISOString() ?? null,
    }));
  }

  public static async giveUsersAccessToProSpace(
    accessRequest: UserProSpaceAccessRequest,
  ): Promise<void> {
    if (
      !accessRequest.userIds?.length ||
      !accessRequest.proSpaceIds?.length ||
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
      accessRequest.proSpaceIds.map((proSpaceId) => [
        userId,
        proSpaceId,
        accessRequest.accessExpiry,
      ]),
    );

    const placeholders = values
      .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
      .join(", ");

    await pool.query(
      `INSERT INTO UserProSpaceAccess (user_id, pro_space_id, access_expiry)
      VALUES ${placeholders}
      ON CONFLICT (user_id, pro_space_id)
      DO UPDATE SET access_expiry = EXCLUDED.access_expiry`,
      values.flat(),
    );
  }

  public static async revokeUsersAccessFromProSpace(
    accessRequest: UserProSpaceRevokeRequest,
  ): Promise<void> {
    if (!accessRequest.userIds?.length || !accessRequest.proSpaceIds?.length)
      return;

    await pool.query(
      `DELETE FROM UserProSpaceAccess 
        WHERE pro_space_id = ANY($1) 
        AND user_id = ANY($2)`,
      [accessRequest.proSpaceIds, accessRequest.userIds],
    );
  }

  private static async revokeAllAccessFromProSpace(
    proSpaceId: string,
    client: PoolClient,
  ) {
    await client.query(
      `DELETE FROM UserProSpaceAccess WHERE pro_space_id = $1`,
      [proSpaceId],
    );
  }

  public static async getAllUserAccesses(): Promise<
    UserProSpaceAccessAdminDTO[]
  > {
    const res = await pool.query<User & UserProSpaceAccess & ProSpace>(
      `SELECT *
      FROM Users u
      JOIN UserProSpaceAccess upsa ON u.id = upsa.user_id
      JOIN ProSpaces a ON upsa.pro_space_id = a.id
      WHERE upsa.access_expiry > NOW() OR upsa.access_expiry IS NULL
      ORDER BY u.first_name, u.last_name, u.email, a.name ASC`,
    );

    return res.rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      proSpaceId: row.pro_space_id,
      proSpaceName: row.name,
      accessExpiry: row.access_expiry?.toISOString() ?? null,
    }));
  }

  private static toDB(
    data: ValidatedCreateProSpaceRequest | ValidatedUpdateProSpaceRequest,
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

  private static toDTO(row: ProSpace): ProSpaceBaseAdminDTO {
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

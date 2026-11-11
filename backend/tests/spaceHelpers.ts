import pool from "../db";

/**
 * Apartments and pro spaces share their routes, services and guards
 * (factories), but each kind has its own wiring: tables, access table,
 * media contexts, request field names. Tests that run once per kind catch
 * a slip in that wiring.
 */
export const SPACE_KINDS = {
  apartment: {
    table: "Apartments",
    accessTable: "UserApartmentAccess",
    accessColumn: "apartment_id",
    path: "/apartments",
    adminPath: "/admin/apartments",
    idsField: "apartmentIds",
    mediaContext: "apartment",
    commonContext: "apartment-common",
    extraColumns: {
      induction_cooktop_model: "Model I",
      oven_model: "Model O",
      range_hood_model: "Model R",
    },
    extraBody: {
      inductionCooktopModel: "Model I",
      ovenModel: "Model O",
      rangeHoodModel: "Model R",
    },
  },
  "pro-space": {
    table: "ProSpaces",
    accessTable: "UserProSpaceAccess",
    accessColumn: "pro_space_id",
    path: "/pro-spaces",
    adminPath: "/admin/pro-spaces",
    idsField: "proSpaceIds",
    mediaContext: "pro-space",
    commonContext: "pro-space-common",
    extraColumns: {},
    extraBody: {},
  },
} as const;

export type SpaceKindName = keyof typeof SPACE_KINDS;
export const KIND_NAMES = Object.keys(SPACE_KINDS) as SpaceKindName[];

// Shared columns of Apartments and ProSpaces, with valid values.
const SPACE_COLUMNS: Record<string, unknown> = {
  description: "Test unit",
  type: "T2",
  size_carrez_sqm: 40,
  size_floor_sqm: 42,
  floor: "1",
  orientation: "Sud",
  view: "Jardin",
  electric_heating_model: "Model H",
  bathroom_towel_heater_model: "Model T",
  electric_water_heater_model: "Model W",
  kitchen_cabinets_model: "Model K",
  meter_power_kva: 6,
  delivery_point_id: "12345678901234",
  land_registry_ref_pre_2025: "AB 123",
  land_registry_ref_post_2025: "AB 456",
};

/** A valid POST body for /admin/apartments or /admin/pro-spaces. */
export function spaceCreateBody(kind: SpaceKindName, name = "Unit A") {
  return {
    name,
    description: "Bureau lumineux au premier étage.",
    type: "T2",
    sizeCarrezSqm: 25.5,
    sizeFloorSqm: 27,
    floor: "1er",
    orientation: "Est",
    view: "Cour",
    hasPrivateExterior: false,
    hasPrivateParking: true,
    electricHeatingModel: "Model H",
    bathroomTowelHeaterModel: "Model T",
    electricWaterHeaterModel: "Model W",
    kitchenCabinetsModel: "Model K",
    dpeEnergyRating: "C",
    dpeEnergyKwhPerSqmYear: 150,
    dpeEmissionsRating: "B",
    dpeEmissionsKgPerSqmYear: 10,
    previousTenantAnnualConsumptionEur: "900",
    hasDoubleGlazedWindows: true,
    meterPowerKva: 9,
    deliveryPointId: "12345678901234",
    hasFiberOptic: true,
    hasCopperNetwork: false,
    hasTvOutlet: false,
    landRegistryRefPre2025: "AB 123",
    landRegistryRefPost2025: "AB 456",
    ...SPACE_KINDS[kind].extraBody,
  };
}

/** Inserts a unit directly and returns its id. */
export async function createSpace(
  kind: SpaceKindName,
  name = "Unit A",
): Promise<string> {
  const { table, extraColumns } = SPACE_KINDS[kind];
  const columns: Record<string, unknown> = {
    name,
    ...SPACE_COLUMNS,
    ...extraColumns,
  };
  const keys = Object.keys(columns);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO ${table} (${keys.join(", ")})
     VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")})
     RETURNING id`,
    Object.values(columns),
  );
  return rows[0].id;
}

/** expiresInDays: omitted = no expiry, negative = already expired. */
export async function grantAccess(
  kind: SpaceKindName,
  userId: string,
  spaceId: string,
  expiresInDays?: number,
): Promise<void> {
  const { accessTable, accessColumn } = SPACE_KINDS[kind];
  await pool.query(
    `INSERT INTO ${accessTable} (user_id, ${accessColumn}, access_expiry)
     VALUES ($1, $2, $3)`,
    [
      userId,
      spaceId,
      expiresInDays === undefined
        ? null
        : new Date(Date.now() + expiresInDays * 86_400_000),
    ],
  );
}

/** Grant rows for this unit, as stored. */
export async function accessRows(
  kind: SpaceKindName,
  spaceId: string,
): Promise<{ user_id: string; access_expiry: Date | null }[]> {
  const { accessTable, accessColumn } = SPACE_KINDS[kind];
  const { rows } = await pool.query(
    `SELECT user_id, access_expiry FROM ${accessTable} WHERE ${accessColumn} = $1`,
    [spaceId],
  );
  return rows;
}

/**
 * Inserts a Media row (no file on disk: nginx serves it). A null
 * contextId means common-area media, e.g. context "apartment-common".
 */
export async function createMedia(
  context: string,
  contextId: string | null,
  role: "REGULAR" | "THUMBNAIL",
): Promise<{ id: string; filePath: string }> {
  const filePath = `${context}/${contextId ?? "common"}/${role.toLowerCase()}-${Date.now()}.webp`;
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO Media (file_path, mime_type, size_bytes, context, context_id, role, type)
     VALUES ($1, 'image/webp', 1024, $2, $3, $4, 'IMAGE')
     RETURNING id`,
    [filePath, context, contextId, role],
  );
  return { id: rows[0].id, filePath };
}

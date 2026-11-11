import bcrypt from "bcrypt";
import { vi } from "vitest";
import type { Response } from "supertest";
import pool from "../db";
import { sendEmail } from "../emails/mailer";
import { generateAccessToken } from "../utils/tokens";

/** Meets the new-password rules (length, upper, lower, digit, symbol). */
export const PASSWORD = "Correct-Horse-9";

const TABLES = [
  "Users",
  "Apartments",
  "ProSpaces",
  "Media",
  "UserApartmentAccess",
  "UserProSpaceAccess",
  "Reviews",
];

export async function resetDatabase(): Promise<void> {
  await pool.query(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
}

let counter = 0;
export const uniqueEmail = () => `user${++counter}-${Date.now()}@example.com`;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

/** Inserts a user directly, skipping the registration flow. */
export async function createUser(
  options: { email?: string; verified?: boolean; isAdmin?: boolean } = {},
): Promise<TestUser> {
  const email = options.email ?? uniqueEmail();
  const isAdmin = options.isAdmin ?? false;
  // Low cost keeps tests fast; bcrypt.compare reads the cost from the hash.
  const hash = await bcrypt.hash(PASSWORD, 4);

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO Users (email, password_hash, email_verified, first_name, last_name, is_admin)
     VALUES ($1, $2, $3, 'Test', 'User', $4)
     RETURNING id`,
    [email, hash, options.verified ?? true, isAdmin],
  );

  return { id: rows[0].id, email, password: PASSWORD, isAdmin };
}

/** Cookie header carrying a valid access token, as the browser would send it. */
export function authCookie(user: { id: string; isAdmin: boolean }): string {
  return `accessToken=${generateAccessToken(user.id, user.isAdmin)}`;
}

/** Value of a cookie set by a response, or undefined. */
export function getCookie(res: Response, name: string): string | undefined {
  const header = res.headers["set-cookie"] as unknown as string[] | undefined;
  const cookie = header?.find((c) => c.startsWith(`${name}=`));
  return cookie?.split(";")[0].slice(name.length + 1);
}

/**
 * The raw token from the last email sent to this address, read from the
 * link the way a user's click would deliver it.
 */
export function lastEmailedToken(to: string): string {
  const calls = vi.mocked(sendEmail).mock.calls;
  const message = [...calls].reverse().find(([m]) => m.to === to)?.[0];
  const match = message?.html.match(/token=([^"&\s]+)/);
  if (!match) throw new Error(`No token emailed to ${to}`);
  return decodeURIComponent(match[1]);
}

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

/** Inserts an apartment directly and returns its id. */
export async function createApartment(name = "Apartment A"): Promise<string> {
  const columns: Record<string, unknown> = {
    name,
    ...SPACE_COLUMNS,
    induction_cooktop_model: "Model I",
    oven_model: "Model O",
    range_hood_model: "Model R",
  };
  const keys = Object.keys(columns);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO Apartments (${keys.join(", ")})
     VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")})
     RETURNING id`,
    Object.values(columns),
  );
  return rows[0].id;
}

/** expiresInDays: omitted = no expiry, negative = already expired. */
export async function grantApartment(
  userId: string,
  apartmentId: string,
  expiresInDays?: number,
): Promise<void> {
  await pool.query(
    `INSERT INTO UserApartmentAccess (user_id, apartment_id, access_expiry)
     VALUES ($1, $2, $3)`,
    [
      userId,
      apartmentId,
      expiresInDays === undefined
        ? null
        : new Date(Date.now() + expiresInDays * 86_400_000),
    ],
  );
}

/** Inserts a Media row for an apartment (no file on disk: nginx serves it). */
export async function createMedia(
  apartmentId: string,
  role: "REGULAR" | "THUMBNAIL",
): Promise<{ id: string; filePath: string }> {
  const filePath = `apartment/${apartmentId}/${role.toLowerCase()}.webp`;
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO Media (file_path, mime_type, size_bytes, context, context_id, role, type)
     VALUES ($1, 'image/webp', 1024, 'apartment', $2, $3, 'IMAGE')
     RETURNING id`,
    [filePath, apartmentId, role],
  );
  return { id: rows[0].id, filePath };
}

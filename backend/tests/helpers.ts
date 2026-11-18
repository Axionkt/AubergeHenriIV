import bcrypt from "bcrypt";
import { vi } from "vitest";
import request, { type Response } from "supertest";
import type { Express } from "express";
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

/**
 * Runs the Google redirect flow: /google/start, then the callback as Google
 * would send it back. The code exchange is faked in setup.ts, so the code
 * "google:<email>" signs in as <email>.
 */
export async function googleSignIn(
  app: Express,
  intent: "login" | "register",
  email: string,
  options: { returnTo?: string; state?: string; withCookie?: boolean } = {},
) {
  const query = new URLSearchParams({ intent });
  if (options.returnTo) query.set("returnTo", options.returnTo);
  const start = await request(app).get(`/auth/google/start?${query}`);
  const cookie = getCookie(start, "googleOAuth");
  const googleUrl = new URL(start.headers.location);

  const state = options.state ?? googleUrl.searchParams.get("state") ?? "";
  const callback = request(app).get(
    `/auth/google/callback?${new URLSearchParams({ code: `google:${email}`, state })}`,
  );
  if (options.withCookie !== false)
    callback.set("Cookie", `googleOAuth=${cookie}`);
  return { start, googleUrl, callback: await callback };
}

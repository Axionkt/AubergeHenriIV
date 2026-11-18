import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { config } from "../config";

/**
 * Short-lived cookie that carries the Google sign-in attempt across the
 * redirect to Google and back:
 * - state: ties the callback to this browser (stops forged sign-ins)
 * - verifier: PKCE secret, so a stolen authorization code is useless
 * - nonce: ties the ID token to this attempt (stops token replay)
 */
const GOOGLE_OAUTH_COOKIE = "googleOAuth";

export type GoogleIntent = "login" | "register";

export interface GoogleOAuthAttempt {
  state: string;
  verifier: string;
  nonce: string;
  intent: GoogleIntent;
  /** Validated in-app path to land on after a successful login. */
  returnTo: string | null;
}

const TTL_MS = 10 * 60_000;

// Own key, derived from the access secret: an attempt cookie can never pass
// as an access token, and the reverse.
const KEY = crypto
  .createHmac("sha256", config.JWT_ACCESS_SECRET)
  .update("google-oauth-attempt")
  .digest();

const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  // Lax, not Strict: the callback is a top-level navigation coming from
  // accounts.google.com, and Strict cookies are not sent on it.
  sameSite: "lax" as const,
  path: "/api/auth/google",
};

export function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function setGoogleOAuthCookie(
  res: Response,
  attempt: GoogleOAuthAttempt,
): void {
  const token = jwt.sign(attempt, KEY, {
    algorithm: "HS256",
    expiresIn: TTL_MS / 1000,
  });
  res.cookie(GOOGLE_OAUTH_COOKIE, token, { ...cookieOptions, maxAge: TTL_MS });
}

export function clearGoogleOAuthCookie(res: Response): void {
  res.clearCookie(GOOGLE_OAUTH_COOKIE, cookieOptions);
}

/** The attempt stored in the cookie, or null if missing, expired or forged. */
export function readGoogleOAuthCookie(req: Request): GoogleOAuthAttempt | null {
  const token = req.cookies?.[GOOGLE_OAUTH_COOKIE];
  if (typeof token !== "string") return null;
  try {
    const payload = jwt.verify(token, KEY, { algorithms: ["HS256"] });
    if (typeof payload !== "object" || payload === null) return null;
    const { state, verifier, nonce, intent, returnTo } =
      payload as Partial<GoogleOAuthAttempt>;
    if (
      typeof state !== "string" ||
      typeof verifier !== "string" ||
      typeof nonce !== "string" ||
      (intent !== "login" && intent !== "register")
    ) {
      return null;
    }
    return {
      state,
      verifier,
      nonce,
      intent,
      returnTo: typeof returnTo === "string" ? returnTo : null,
    };
  } catch {
    return null;
  }
}

export function sameToken(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Only in-app paths are allowed as a landing page, so the sign-in flow can't
 * be used to send people to another site.
 */
export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 200) return null;
  if (!/^\/(?![/\\])[\w\-./?=&%]*$/.test(value)) return null;
  return value;
}

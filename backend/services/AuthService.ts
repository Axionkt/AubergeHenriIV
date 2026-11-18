import crypto from "node:crypto";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { config } from "../config";
import pool from "../db";
import {
  toGoogleProfile,
  type GoogleProfile,
  type RegisterRequest,
} from "../schemas/auth";
import { hashToken } from "../utils/hashToken";
import { SafeUser } from "../models/User";
import { UserDTO } from "../types/user";
import { BadRequestError } from "../utils/errors/BadRequestError";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";
import { ForbiddenError } from "../utils/errors/ForbiddenError";
import { ERROR_CODES } from "../utils/errors/errorCodes";
import { comparePassword, hashPassword } from "../utils/password";
import { logSecurityEvent } from "../utils/logger";
import { sendInBackground } from "../emails/mailer";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../emails/notify";
import UserService, { SAFE_USER_COLUMNS } from "./UserService";

// bcrypt hash of a random string: comparing against it when the account
// doesn't exist keeps login timing the same for known and unknown emails.
const DUMMY_PASSWORD_HASH =
  "$2b$12$LY/Caa0MR4NJ7PpZCntXd.EZsuqUqrsQrvdUoIhXWBSw2P3nUuIEe";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

/** Where Google sends the user back; must be listed in the Google console. */
const GOOGLE_REDIRECT_URI = `${config.FRONTEND_URL.replace(/\/+$/, "")}/api/auth/google/callback`;

const googleClient = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
);

export interface Session {
  user: UserDTO;
  tokenVersion: number;
}

/**
 * A random single-use token. The raw value goes in the email link; only its
 * SHA-256 digest is stored, so a database leak yields no working links.
 */
function newEmailToken(ttlMs: number) {
  const raw = crypto.randomBytes(32).toString("hex");
  return {
    raw,
    hash: hashToken(raw),
    expires: new Date(Date.now() + ttlMs),
  };
}

function accountExistsError() {
  return new BadRequestError(
    "Un compte avec cet email existe déjà.",
    ERROR_CODES.ALREADY_EXISTS,
  );
}

export default class AuthService {
  public static async register(data: RegisterRequest): Promise<void> {
    const hashedPassword = await hashPassword(data.password);
    const token = newEmailToken(VERIFICATION_TTL_MS);

    const res = await pool.query<SafeUser>(
      `INSERT INTO Users
        (email, password_hash, email_verified, email_verification_token,
         email_verification_expires, first_name, last_name)
       VALUES ($1, $2, FALSE, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING ${SAFE_USER_COLUMNS}`,
      [
        data.email,
        hashedPassword,
        token.hash,
        token.expires,
        data.firstName,
        data.lastName,
      ],
    );

    if (res.rows.length === 0) {
      // Deliberate: we tell the user the account exists (clearer UX).
      // Probing is limited by registerLimiter (5/hour/IP).
      throw accountExistsError();
    }

    sendInBackground(
      "sendVerificationEmail",
      sendVerificationEmail(res.rows[0].email, res.rows[0].first_name, token.raw),
    );
  }

  /**
   * Google's sign-in page for this attempt (authorization code flow with
   * PKCE). Only the basic openid/email/profile scopes are requested.
   */
  public static googleAuthUrl(attempt: {
    state: string;
    verifier: string;
    nonce: string;
  }): string {
    const challenge = crypto
      .createHash("sha256")
      .update(attempt.verifier)
      .digest("base64url");
    return googleClient.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      state: attempt.state,
      nonce: attempt.nonce,
      code_challenge: challenge,
      code_challenge_method: CodeChallengeMethod.S256,
      prompt: "select_account",
    });
  }

  /**
   * Exchanges the authorization code from Google's redirect for the user's
   * verified profile. The code is single-use and bound to this attempt's
   * PKCE verifier; the ID token must carry this attempt's nonce.
   */
  public static async exchangeGoogleCode(
    code: string,
    verifier: string,
    nonce: string,
  ): Promise<GoogleProfile> {
    let payload;
    let stage = "code_exchange";
    try {
      const { tokens } = await googleClient.getToken({
        code,
        codeVerifier: verifier,
      });
      stage = "id_token";
      if (!tokens.id_token) throw new Error("No ID token");
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: config.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      // Never log the error itself: Google client errors carry the request
      // (code, verifier, client secret) and ID token errors the user's
      // profile. Google's OAuth error code (e.g. invalid_grant) is enough to
      // spot a misconfigured secret or redirect URI.
      const oauthError = (err as { response?: { data?: { error?: unknown } } })
        ?.response?.data?.error;
      logSecurityEvent("google_sign_in_failed", {
        operation: "auth.googleCallback",
        reason:
          typeof oauthError === "string" ? `${stage}:${oauthError}` : stage,
      });
      throw new UnauthorizedError("Connexion Google invalide.");
    }

    if (!payload?.email || payload.nonce !== nonce) {
      throw new UnauthorizedError("Connexion Google invalide.");
    }
    if (!payload.email_verified) {
      throw new ForbiddenError(
        "L'adresse e-mail du compte Google n'est pas vérifiée.",
      );
    }

    return toGoogleProfile({
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
    });
  }

  public static async registerGoogle(profile: GoogleProfile): Promise<Session> {
    const res = await pool.query<SafeUser>(
      `INSERT INTO Users (email, email_verified, is_google_auth, first_name, last_name)
       VALUES ($1, TRUE, TRUE, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING ${SAFE_USER_COLUMNS}`,
      [profile.email, profile.firstName, profile.lastName],
    );

    if (res.rows.length === 0) throw accountExistsError();

    return UserService.toSession(res.rows[0]);
  }

  public static async resendVerification(email: string): Promise<void> {
    const user = await pool.query<
      Pick<SafeUser, "id" | "email" | "first_name" | "email_verified">
    >(
      `SELECT id, email, first_name, email_verified FROM Users WHERE email = $1`,
      [email],
    );

    // Same outcome whether the account is missing or already verified, so
    // the response can't be used to probe which emails exist.
    if (user.rowCount === 0 || user.rows[0].email_verified) return;

    const token = newEmailToken(VERIFICATION_TTL_MS);

    await pool.query(
      `UPDATE Users
       SET email_verification_token = $1,
           email_verification_expires = $2
       WHERE id = $3`,
      [token.hash, token.expires, user.rows[0].id],
    );

    sendInBackground(
      "sendVerificationEmail",
      sendVerificationEmail(user.rows[0].email, user.rows[0].first_name, token.raw),
    );
  }

  public static async verifyEmail(token: string): Promise<void> {
    const res = await pool.query(
      `UPDATE Users
       SET email_verified = TRUE,
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE email_verification_token = $1
         AND email_verification_expires > NOW()`,
      [hashToken(token)],
    );

    if (res.rowCount === 0) {
      throw new BadRequestError(
        "Lien invalide ou expiré.",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
  }

  public static async requestPasswordReset(email: string): Promise<void> {
    const result = await pool.query<{
      id: string;
      email: string;
      first_name: string;
      has_password: boolean;
    }>(
      `SELECT id, email, first_name, password_hash IS NOT NULL AS has_password
       FROM Users WHERE email = $1`,
      [email],
    );

    const user = result.rows[0];

    // Google-only accounts have no password to reset. Return silently
    // either way so the response doesn't reveal which emails exist.
    if (!user || !user.has_password) return;

    const token = newEmailToken(RESET_TTL_MS);

    await pool.query(
      `UPDATE Users
       SET password_reset_token = $1,
           password_reset_expires = $2
       WHERE id = $3`,
      [token.hash, token.expires, user.id],
    );

    sendInBackground(
      "sendPasswordResetEmail",
      sendPasswordResetEmail(user.email, user.first_name, token.raw),
    );
  }

  /**
   * Sets the new password, burns the reset token and bumps token_version,
   * which invalidates every refresh token issued before the reset.
   */
  public static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const hashed = await hashPassword(newPassword);

    const res = await pool.query(
      `UPDATE Users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           token_version = token_version + 1
       WHERE password_reset_token = $2
         AND password_reset_expires > NOW()`,
      [hashed, hashToken(token)],
    );

    if (res.rowCount === 0) {
      throw new BadRequestError(
        "Lien invalide ou expiré.",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
  }

  public static async verifyCredentials(
    email: string,
    password: string,
  ): Promise<Session> {
    const result = await pool.query<
      SafeUser & { password_hash: string | null; is_google_auth: boolean }
    >(
      `SELECT ${SAFE_USER_COLUMNS}, password_hash, is_google_auth
       FROM Users WHERE email = $1`,
      [email],
    );

    const user = result.rows[0];

    // Always run bcrypt so response time doesn't reveal whether the email exists.
    const passwordMatches = await comparePassword(
      password,
      user?.password_hash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user) {
      logLoginFailure("invalid_credentials");
      throw new UnauthorizedError("Identifiants invalides.");
    }

    if (!user.password_hash) {
      // Deliberate UX tradeoff: tells the user to use the Google button.
      logLoginFailure("google_account_password_attempt");
      throw new UnauthorizedError(
        "Ce compte est enregistré avec Google. Veuillez vous connecter avec le bouton « Continuer avec Google ».",
      );
    }

    if (!passwordMatches) {
      logLoginFailure("invalid_credentials");
      throw new UnauthorizedError("Identifiants invalides.");
    }

    if (!user.email_verified) {
      logLoginFailure("email_not_verified");
      throw new ForbiddenError("Vérifiez votre compte.");
    }

    return UserService.toSession(user);
  }

  public static async verifyCredentialsGoogle(email: string): Promise<Session> {
    const result = await pool.query<SafeUser & { is_google_auth: boolean }>(
      `SELECT ${SAFE_USER_COLUMNS}, is_google_auth FROM Users WHERE email = $1`,
      [email],
    );

    const user = result.rows[0];

    if (!user || !user.is_google_auth) {
      logLoginFailure("google_account_not_found");
      throw new UnauthorizedError("Identifiants invalides.");
    }

    return UserService.toSession(user);
  }
}

function logLoginFailure(reason: string) {
  logSecurityEvent("login_failed", {
    operation: "verifyCredentials",
    reason,
    status: 401,
  });
}

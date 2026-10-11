import crypto from "crypto";
import pool from "../db";
import User from "../models/User";
import { UserDTO } from "../types/user";
import { BadRequestError } from "../utils/errors/BadRequestError";
import { NotFoundError } from "../utils/errors/NotFoundError";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";
import { comparePassword, hashPassword } from "../utils/password";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email";
import { ForbiddenError } from "../utils/errors/ForbiddenError";

const DUMMY_PASSWORD_HASH =
  "$2b$12$LY/Caa0MR4NJ7PpZCntXd.EZsuqUqrsQrvdUoIhXWBSw2P3nUuIEe";

interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface RegisterGoogle {
  email: string;
  firstName: string;
  lastName: string;
}

export default class UserManagement {
  public static async initializeUserSession(userId: string): Promise<User> {
    const res = await pool.query<User>("SELECT * FROM Users WHERE id = $1", [
      userId,
    ]);

    if (res.rowCount === 0) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return res.rows[0];
  }

  public static async register(userData: RegisterUserData): Promise<void> {
    await this.verifyNewUserData(userData);

    const hashedPassword = await hashPassword(userData.password);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const res = await pool.query<User>(
      `INSERT INTO Users
        (email, password_hash, email_verified, email_verification_token, email_verification_expires, 
        first_name, last_name, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, first_name, last_name, is_admin, created_at`,
      [
        userData.email,
        hashedPassword,
        false,
        verificationToken,
        expires,
        userData.firstName,
        userData.lastName,
      ],
    );

    if (res.rows.length === 0) {
      throw new BadRequestError("Un compte avec cet email existe déjà.");
    }

    sendVerificationEmail(
      res.rows[0].email,
      res.rows[0].first_name,
      verificationToken,
    );
  }

  public static async updateUserEmailVerificationStatus(email: string) {
    const user = await pool.query<User>(
      `SELECT * FROM Users WHERE email = $1`,
      [email],
    );

    if (user.rowCount === 0) {
      throw new BadRequestError("Utilisateur introuvable.");
    }

    if (user.rows[0].email_verified) {
      throw new BadRequestError("Cet email est déjà vérifié.");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE Users
      SET email_verification_token = $1,
        email_verification_expires = $2
      WHERE email = $3`,
      [verificationToken, expires, email],
    );

    sendVerificationEmail(
      user.rows[0].email,
      user.rows[0].first_name,
      verificationToken,
    );
  }

  public static async verifyEmailRegistration(token: string) {
    const user = await pool.query<{ id: string }>(
      `SELECT id
      FROM Users
      WHERE email_verification_token = $1
        AND email_verification_expires > NOW()`,
      [token],
    );

    if (user.rows.length === 0) {
      throw new BadRequestError("Token invalide ou expiré.");
    }

    await pool.query(
      `UPDATE Users
      SET email_verified = TRUE,
        email_verification_token = NULL,
        email_verification_expires = NULL
      WHERE id = $1`,
      [user.rows[0].id],
    );
  }

  public static async requestPasswordReset(email: string): Promise<void> {
    const result = await pool.query<User>(
      "SELECT * FROM Users WHERE email = $1",
      [email.trim().toLowerCase()],
    );

    if (result.rowCount === 0) return;

    const user = result.rows[0];

    if (user.is_google_auth && !user.password_hash) return;

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `UPDATE Users
     SET password_reset_token = $1,
         password_reset_expires = $2
     WHERE id = $3`,
      [token, expires, user.id],
    );

    sendPasswordResetEmail(user.email, user.first_name, token);
  }

  public static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const result = await pool.query<User>(
      `SELECT * FROM Users
     WHERE password_reset_token = $1
       AND password_reset_expires > NOW()`,
      [token],
    );

    if (result.rows.length === 0) {
      throw new BadRequestError("Lien invalide ou expiré.");
    }

    const user = result.rows[0];

    if (!this.passwordStrength(newPassword)) {
      throw new BadRequestError(
        "Le mot de passe ne respecte pas les critères de sécurité.",
      );
    }

    const hashed = await hashPassword(newPassword);

    await pool.query(
      `UPDATE Users
     SET password_hash = $1,
         password_reset_token = NULL,
         password_reset_expires = NULL
     WHERE id = $2`,
      [hashed, user.id],
    );
  }

  public static async registerGoogle(
    userData: RegisterGoogle,
  ): Promise<UserDTO> {
    userData.email = userData.email.trim().toLowerCase();

    if (await this.exists(userData.email)) {
      throw new BadRequestError("Un compte avec cet email existe déjà.");
    }

    const res = await pool.query<User>(
      `INSERT INTO Users (email, email_verified, is_google_auth, first_name, last_name, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, first_name, last_name, is_admin, email_verified, created_at`,
      [userData.email, true, true, userData.firstName, userData.lastName],
    );

    if (res.rows.length === 0) {
      throw new BadRequestError("Un compte avec cet email existe déjà.");
    }

    return {
      id: res.rows[0].id,
      email: res.rows[0].email,
      firstName: res.rows[0].first_name,
      lastName: res.rows[0].last_name,
      isAdmin: res.rows[0].is_admin,
      isVerified: res.rows[0].email_verified,
      createdAt: res.rows[0].created_at.toISOString(),
    };
  }

  public static async verifyCredentials(
    email: string,
    password: string,
  ): Promise<UserDTO> {
    const result = await pool.query<User>(
      "SELECT * FROM Users WHERE email = $1",
      [email],
    );

    const user = result.rows[0];

    const hashToCompare = user?.password_hash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await comparePassword(password, hashToCompare);

    if (result.rowCount === 0) {
      throw new UnauthorizedError("Identifiants invalides.");
    }

    if (user.is_google_auth || !user.password_hash) {
      throw new UnauthorizedError(
        "Ce compte est enregistré avec Google. Veuillez vous connecter avec le bouton « Continuer avec Google ».",
      );
    }

    if (!passwordMatches) {
      throw new UnauthorizedError("Identifiants invalides.");
    }

    if (!user.email_verified) {
      throw new ForbiddenError("Vérifiez votre compte.");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin,
      isVerified: user.email_verified,
      createdAt: user.created_at.toISOString(),
    };
  }

  public static async verifyCredentialsGoogle(email: string): Promise<UserDTO> {
    const result = await pool.query<User>(
      "SELECT * FROM Users WHERE email = $1",
      [email],
    );

    const user = result.rows[0];

    if (result.rowCount === 0 || !user.is_google_auth) {
      throw new UnauthorizedError("Identifiants invalides.");
    }

    if (!user.email_verified) {
      throw new ForbiddenError("Vérifiez votre compte.");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin,
      isVerified: user.email_verified,
      createdAt: user.created_at.toISOString(),
    };
  }

  private static async verifyNewUserData(
    user: RegisterUserData,
  ): Promise<boolean> {
    if (!user.email || !user.password || !user.firstName || !user.lastName) {
      throw new BadRequestError("Champs obligatoires manquants.");
    }

    if (!this.passwordStrength(user.password)) {
      throw new BadRequestError(
        "Le mot de passe ne respecte pas les critères de sécurité.",
      );
    }

    user.email = user.email.trim().toLowerCase();

    if (await this.exists(user.email)) {
      throw new BadRequestError("Un compte avec cet email existe déjà.");
    }

    return true;
  }

  private static passwordStrength(password: string): boolean {
    const RULES = [
      (pw: string) => pw.length >= 10,
      (pw: string) => /[A-Z]/.test(pw),
      (pw: string) => /[a-z]/.test(pw),
      (pw: string) => /[0-9]/.test(pw),
      (pw: string) => /[^A-Za-z0-9]/.test(pw),
      (pw: string) => !/\s/.test(pw),
    ];

    return RULES.every((rule) => rule(password));
  }

  private static async exists(email: string): Promise<boolean> {
    const res = await pool.query(
      "SELECT 1 FROM Users WHERE email = $1 LIMIT 1",
      [email],
    );
    return !!res.rowCount;
  }
}

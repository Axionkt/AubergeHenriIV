import { z } from "zod";
import {
  textField,
  tokenField,
  toValidationOutcome,
  type ValidationOutcome,
} from "./shared/fields";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email({ message: "Adresse e-mail invalide." })
      .max(254, "L'adresse e-mail est trop longue."),
  );

/**
 * Rules for a NEW password (registration, reset). Capped at 72 bytes since
 * bcrypt silently ignores anything past that, so two long passwords
 * sharing a 72-byte prefix would otherwise hash identically.
 */
const newPasswordField = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
  .refine((pw) => Buffer.byteLength(pw, "utf8") <= 72, {
    message: "Le mot de passe est trop long (72 octets maximum).",
  })
  .refine((pw) => /[A-Z]/.test(pw), {
    message: "Le mot de passe doit contenir une majuscule.",
  })
  .refine((pw) => /[a-z]/.test(pw), {
    message: "Le mot de passe doit contenir une minuscule.",
  })
  .refine((pw) => /[0-9]/.test(pw), {
    message: "Le mot de passe doit contenir un chiffre.",
  })
  .refine((pw) => /[^A-Za-z0-9]/.test(pw), {
    message: "Le mot de passe doit contenir un caractère spécial.",
  })
  .refine((pw) => !/\s/.test(pw), {
    message: "Le mot de passe ne doit pas contenir d'espaces.",
  });

/**
 * Login password — bounds only, no complexity re-check. An existing
 * account's password was validated against whatever rules applied when it
 * was set, which may not match current rules, so re-enforcing complexity
 * here would risk locking out legitimate existing users.
 */
const loginPasswordField = z
  .string()
  .min(1, "Le mot de passe est requis.")
  .max(72, "Le mot de passe ne doit pas dépasser 72 caractères.");

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

export const registerRequestSchema = z
  .object({
    email: emailField,
    password: newPasswordField,
    firstName: textField(1, 100),
    lastName: textField(1, 100),
  })
  .strict();

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export function validateRegisterRequest(
  body: unknown,
): ValidationOutcome<RegisterRequest> {
  return toValidationOutcome(registerRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// POST /verify-email (the frontend page reads ?token= and POSTs it)
// ---------------------------------------------------------------------------

export const verifyEmailBodySchema = z
  .object({ token: tokenField(512) })
  .strict();

export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;

export function validateVerifyEmailBody(
  body: unknown,
): ValidationOutcome<VerifyEmailBody> {
  return toValidationOutcome(verifyEmailBodySchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// POST /resend-verification
// ---------------------------------------------------------------------------

export const resendVerificationRequestSchema = z
  .object({ email: emailField })
  .strict();

export type ResendVerificationRequest = z.infer<
  typeof resendVerificationRequestSchema
>;

export function validateResendVerificationRequest(
  body: unknown,
): ValidationOutcome<ResendVerificationRequest> {
  return toValidationOutcome(resendVerificationRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// POST /forgot-password
//
// _hp is a honeypot field: real users never fill it in (it's hidden), bots
// filling every field will. Kept as optional+unrestricted since it's not a
// real input to validate — just check its presence in the route handler,
// BEFORE running this schema, so a bot never learns anything about
// validation from the response.
// ---------------------------------------------------------------------------

export const forgotPasswordRequestSchema = z
  .object({
    email: emailField,
    _hp: z.string().optional(),
  })
  .strict();

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export function validateForgotPasswordRequest(
  body: unknown,
): ValidationOutcome<ForgotPasswordRequest> {
  return toValidationOutcome(forgotPasswordRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// POST /reset-password
// ---------------------------------------------------------------------------

export const resetPasswordRequestSchema = z
  .object({
    token: tokenField(512),
    password: newPasswordField,
  })
  .strict();

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export function validateResetPasswordRequest(
  body: unknown,
): ValidationOutcome<ResetPasswordRequest> {
  return toValidationOutcome(resetPasswordRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

export const loginRequestSchema = z
  .object({
    email: emailField,
    password: loginPasswordField,
  })
  .strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export function validateLoginRequest(
  body: unknown,
): ValidationOutcome<LoginRequest> {
  return toValidationOutcome(loginRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// POST /google/register and POST /google/login — same body shape.
// ---------------------------------------------------------------------------

export const googleAuthRequestSchema = z
  .object({
    googleToken: tokenField(4096), // Google ID tokens (JWTs) can be sizable
  })
  .strict();

export type GoogleAuthRequest = z.infer<typeof googleAuthRequestSchema>;

export function validateGoogleAuthRequest(
  body: unknown,
): ValidationOutcome<GoogleAuthRequest> {
  return toValidationOutcome(googleAuthRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// Google profile: names come from Google, so they go through the same
// validation as typed names, with fallbacks when missing or invalid.
// ---------------------------------------------------------------------------

const nameField = textField(1, 100);

function cleanName(value: string | undefined, fallback: string): string {
  const result = nameField.safeParse((value ?? "").slice(0, 100));
  return result.success ? result.data : fallback;
}

export interface GoogleProfile {
  email: string;
  firstName: string;
  lastName: string;
}

export function toGoogleProfile(g: {
  email: string;
  given_name?: string;
  family_name?: string;
}): GoogleProfile {
  const emailName = cleanName(g.email.split("@")[0], "Utilisateur");
  return {
    email: g.email.trim().toLowerCase(),
    firstName: cleanName(g.given_name, emailName),
    lastName: cleanName(g.family_name, "-"),
  };
}

import { z } from "zod";
import {
  textField,
  tokenField,
  toValidationOutcome,
  type ValidationOutcome,
} from "./shared/fields";

const emailField = z
  .email({ message: "Adresse e-mail invalide." })
  .max(254, "L'adresse e-mail est trop longue.");

/**
 * Rules for a NEW password (registration, reset). Capped at 72 since
 * bcrypt silently ignores anything past 72 bytes — without this cap, two
 * different very long passwords could hash identically, and there's no
 * value in accepting input that's partly discarded anyway. Adjust the
 * complexity refine below if you already enforce different rules
 * elsewhere (frontend, product requirements, etc).
 */
const newPasswordField = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(72, "Le mot de passe ne doit pas dépasser 72 caractères.")
  .refine((pw) => /[A-Za-z]/.test(pw) && /[0-9]/.test(pw), {
    message: "Le mot de passe doit contenir au moins une lettre et un chiffre.",
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
// GET /verify-email — token comes from req.query, not req.body.
// ---------------------------------------------------------------------------

export const verifyEmailQuerySchema = z
  .object({ token: tokenField(512) })
  .strict();

export type VerifyEmailQuery = z.infer<typeof verifyEmailQuerySchema>;

export function validateVerifyEmailQuery(
  query: unknown,
): ValidationOutcome<VerifyEmailQuery> {
  return toValidationOutcome(verifyEmailQuerySchema.safeParse(query));
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
// validation from the response (see the route example below).
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

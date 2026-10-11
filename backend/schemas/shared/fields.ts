import { z } from "zod";
import { fr } from "zod/locales";

// Applies Zod's built-in French translations for its default error messages
// (e.g. "expected string, received undefined" when a required field is
// missing entirely). This only needs to run once, here at import time,
// since z.config() sets a global default. Custom messages passed explicitly
// to .min()/.max()/.refine() etc. below always take priority over this.
z.config(fr());

// ---------------------------------------------------------------------------
// Low-level building blocks shared across all validation schemas.
// Keep these free of any specific concepts so they stay reusable.
// ---------------------------------------------------------------------------

/**
 * Strips control characters and raw HTML tags, then trims.
 * This does NOT make a string "safe to render as HTML" — it just removes the
 * most common vectors for stored XSS / control-char injection in plain-text
 * fields. If a field is ever rendered as HTML (not just text), escape it at
 * render time too.
 */
export function sanitizePlainText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "") // control chars
    .replace(/<[^>]*>/g, "") // strip raw tags like <script>, <img onerror=...>
    .trim();
}

/** A trimmed, sanitized, length-bounded string field. */
export function textField(minLen: number, maxLen: number) {
  return z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(minLen, `Doit contenir au moins ${minLen} caractère(s)`)
        .max(maxLen, `Doit contenir au plus ${maxLen} caractères`),
    );
}

/** Optional / can-be-empty version of textField. */
export function optionalTextField(maxLen: number) {
  return z
    .string()
    .transform(sanitizePlainText)
    .pipe(z.string().max(maxLen, `Doit contenir au plus ${maxLen} caractères`));
}

/** Bounded finite number (rejects NaN, Infinity, and out-of-range values). */
export function boundedNumber(min: number, max: number) {
  return z
    .number()
    .min(min, `Doit être supérieur ou égal à ${min}`)
    .max(max, `Doit être inférieur ou égal à ${max}`);
}

/**
 * Bounded finite number that also enforces a max decimal scale — use this
 * for anything backed by a Postgres NUMERIC(precision, scale) column, so a
 * value like 12.4567 is rejected up front instead of being silently rounded
 * or truncated on insert. `min`/`max` should reflect the actual max
 * representable value for the column, i.e. up to `10^(precision-scale) - 10^-scale`.
 */
export function decimalField(min: number, max: number, decimals = 2) {
  const factor = 10 ** decimals;
  return z
    .number()
    .min(min, `Doit être supérieur ou égal à ${min}`)
    .max(max, `Doit être inférieur ou égal à ${max}`)
    .refine((val) => Math.abs(Math.round(val * factor) - val * factor) < 1e-9, {
      message: `Doit comporter au plus ${decimals} décimale${decimals === 1 ? "" : "s"}`,
    });
}

/** Conservative alphanumeric identifier (letters, digits, dash, underscore). */
const idPattern = /^[A-Za-z0-9_-]*$/;
export function idField(maxLen: number, minLen = 1) {
  return z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(minLen, minLen > 0 ? "Ce champ est requis" : "")
        .max(maxLen, `Doit contenir au plus ${maxLen} caractères`)
        .regex(idPattern, "Contient des caractères invalides"),
    );
}

/**
 * A sanitized, length-bounded opaque token string — use for email
 * verification tokens, password reset tokens, OAuth tokens, etc. Only
 * strips control characters; doesn't restrict charset, since token formats
 * vary (JWTs, base64, hex, ...) and being stricter here risks rejecting a
 * legitimately-formatted token.
 */
export function tokenField(maxLen: number) {
  return z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(1, "Ce champ est requis.")
        .max(maxLen, `Doit contenir au plus ${maxLen} caractères.`),
    );
}

// ---------------------------------------------------------------------------
// Domain-specific enums.
// ---------------------------------------------------------------------------

export const DPE_RATINGS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export const dpeRatingSchema = z.enum(DPE_RATINGS, {
  message: `Doit être l'une des valeurs suivantes : ${DPE_RATINGS.join(", ")}`,
});

// ---------------------------------------------------------------------------
// Generic result / helper types reused by every public validation function.
// ---------------------------------------------------------------------------

export type FieldError = { path: string; message: string };

export type ValidationOutcome<T> =
  | { success: true; data: T }
  | { success: false; errors: FieldError[] };

export function toValidationOutcome<T>(
  result: z.ZodSafeParseResult<T>,
): ValidationOutcome<T> {
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Generic, French, user-facing message for any Zod validation failure.
 * Used the same way across create/update for every resource, and for
 * route param / file upload validation too, so the client always gets a
 * consistent top-level message regardless of what failed. Pair it with
 * `errors` (from ValidationOutcome) for per-field detail.
 */
export const VALIDATION_ERROR_MESSAGE =
  "Les informations fournies sont invalides. Veuillez vérifier les champs saisis et réessayer.";

// ---------------------------------------------------------------------------
// Route param validation for anything coming from req.params (e.g. /:id).
// This is a separate boundary from the request body, so it gets its own
// small schema rather than being folded into the resource field groups.
// ---------------------------------------------------------------------------

export const uuidParamSchema = z.uuid({ message: "Identifiant invalide." });

export function validateUuidParam(id: unknown): ValidationOutcome<string> {
  return toValidationOutcome(uuidParamSchema.safeParse(id));
}

/**
 * Digits only, no leading +/-, no decimals, no hex/exponential notation
 * (which JS's own Number() would otherwise happily accept). Capped at 15
 * digits — comfortably inside Number.MAX_SAFE_INTEGER's 16-digit range —
 * so a caller who does convert it to a number never silently loses
 * precision. If your IDs are BIGINT and can legitimately exceed
 * Number.MAX_SAFE_INTEGER, keep them as strings all the way through rather
 * than converting to number anywhere.
 */
export const idParamSchema = z
  .string()
  .regex(/^\d{1,15}$/, { message: "Identifiant invalide." })
  .refine((value) => Number(value) > 0, { message: "Identifiant invalide." });

export function validateIdParam(id: unknown): ValidationOutcome<string> {
  return toValidationOutcome(idParamSchema.safeParse(id));
}

/**
 * A non-empty, deduplicated array of UUID strings — use for body fields like
 * `mediaIds` (media reorder/delete) or `userIds` (grant/revoke access), or
 * any other "operate on these N resources by id" body field.
 *
 * Enforces:
 * - every item is a valid UUID
 * - at least one item is present
 * - no more than maxItems (default 500) — a sane cap against someone
 *   sending an absurdly large array
 * - no duplicate ids in the list
 */
export function uuidArrayField(maxItems = 500) {
  return z
    .array(uuidParamSchema, "Doit être une liste d'identifiants.")
    .min(1, "Au moins un identifiant est requis.")
    .max(
      maxItems,
      `Vous ne pouvez pas fournir plus de ${maxItems} identifiants à la fois.`,
    )
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "La liste contient des identifiants en double.",
    });
}

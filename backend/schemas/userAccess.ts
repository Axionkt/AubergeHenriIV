import { z } from "zod";
import {
  toValidationOutcome,
  uuidArrayField,
  type ValidationOutcome,
} from "./shared/fields";

// ---------------------------------------------------------------------------
// accessExpiry: an ISO 8601 datetime string, or null for no expiry.
// The client must explicitly send null to mean "no expiry", rather than
// omitting the key.
// ---------------------------------------------------------------------------

const accessExpirySchema = z.iso
  .date({
    message: "La date d'expiration doit être une date ISO 8601 valide.",
  })
  .nullable();

// ---------------------------------------------------------------------------
// Apartment access — grant/revoke.
// Reusing uuidArrayField keeps the "non-empty, deduped, capped" rules
// identical for both id arrays.
// ---------------------------------------------------------------------------

export const userApartmentAccessRequestSchema = z
  .object({
    userIds: uuidArrayField(),
    apartmentIds: uuidArrayField(),
    accessExpiry: accessExpirySchema,
  })
  .strict();

export type UserApartmentAccessRequest = z.infer<
  typeof userApartmentAccessRequestSchema
>;

export function validateUserApartmentAccessRequest(
  body: unknown,
): ValidationOutcome<UserApartmentAccessRequest> {
  return toValidationOutcome(userApartmentAccessRequestSchema.safeParse(body));
}

export const userApartmentRevokeRequestSchema = z
  .object({
    userIds: uuidArrayField(),
    apartmentIds: uuidArrayField(),
  })
  .strict();

export type UserApartmentRevokeRequest = z.infer<
  typeof userApartmentRevokeRequestSchema
>;

export function validateUserApartmentRevokeRequest(
  body: unknown,
): ValidationOutcome<UserApartmentRevokeRequest> {
  return toValidationOutcome(userApartmentRevokeRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// ProSpace access — same shape, just proSpaceIds instead of apartmentIds.
// ---------------------------------------------------------------------------

export const userProSpaceAccessRequestSchema = z
  .object({
    userIds: uuidArrayField(),
    proSpaceIds: uuidArrayField(),
    accessExpiry: accessExpirySchema,
  })
  .strict();

export type UserProSpaceAccessRequest = z.infer<
  typeof userProSpaceAccessRequestSchema
>;

export function validateUserProSpaceAccessRequest(
  body: unknown,
): ValidationOutcome<UserProSpaceAccessRequest> {
  return toValidationOutcome(userProSpaceAccessRequestSchema.safeParse(body));
}

export const userProSpaceRevokeRequestSchema = z
  .object({
    userIds: uuidArrayField(),
    proSpaceIds: uuidArrayField(),
  })
  .strict();

export type UserProSpaceRevokeRequest = z.infer<
  typeof userProSpaceRevokeRequestSchema
>;

export function validateUserProSpaceRevokeRequest(
  body: unknown,
): ValidationOutcome<UserProSpaceRevokeRequest> {
  return toValidationOutcome(userProSpaceRevokeRequestSchema.safeParse(body));
}

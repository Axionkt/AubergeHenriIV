import { z } from "zod";
import {
  toValidationOutcome,
  uuidArrayField,
  type ValidationOutcome,
} from "./shared/fields";
import { toParisNextDayMidnightUTC } from "../utils/time";

// ---------------------------------------------------------------------------
// accessExpiry: an ISO 8601 date string, or null for no expiry.
// The client must explicitly send null to mean "no expiry", rather than
// omitting the key.
// ---------------------------------------------------------------------------

const accessExpirySchema = z.iso
  .date({ message: "La date d'expiration doit être une date ISO 8601 valide." })
  .nullable()
  .transform((d) => (d === null ? null : toParisNextDayMidnightUTC(d)))
  .refine((d) => d === null || new Date(d).getTime() > Date.now(), {
    message: "La date d'expiration d'accès doit être dans le futur.",
  });

// ---------------------------------------------------------------------------
// Grant / revoke. The validators return one neutral shape (spaceIds) so the
// space services don't care whether the body said apartmentIds or proSpaceIds.
// ---------------------------------------------------------------------------

export interface SpaceAccessGrant {
  userIds: string[];
  spaceIds: string[];
  accessExpiry: string | null;
}

export interface SpaceAccessRevoke {
  userIds: string[];
  spaceIds: string[];
}

const apartmentGrantSchema = z
  .object({
    userIds: uuidArrayField(),
    apartmentIds: uuidArrayField(),
    accessExpiry: accessExpirySchema,
  })
  .strict()
  .transform(
    ({ userIds, apartmentIds, accessExpiry }): SpaceAccessGrant => ({
      userIds,
      spaceIds: apartmentIds,
      accessExpiry,
    }),
  );

const apartmentRevokeSchema = z
  .object({ userIds: uuidArrayField(), apartmentIds: uuidArrayField() })
  .strict()
  .transform(
    ({ userIds, apartmentIds }): SpaceAccessRevoke => ({
      userIds,
      spaceIds: apartmentIds,
    }),
  );

const proSpaceGrantSchema = z
  .object({
    userIds: uuidArrayField(),
    proSpaceIds: uuidArrayField(),
    accessExpiry: accessExpirySchema,
  })
  .strict()
  .transform(
    ({ userIds, proSpaceIds, accessExpiry }): SpaceAccessGrant => ({
      userIds,
      spaceIds: proSpaceIds,
      accessExpiry,
    }),
  );

const proSpaceRevokeSchema = z
  .object({ userIds: uuidArrayField(), proSpaceIds: uuidArrayField() })
  .strict()
  .transform(
    ({ userIds, proSpaceIds }): SpaceAccessRevoke => ({
      userIds,
      spaceIds: proSpaceIds,
    }),
  );

export function validateUserApartmentAccessRequest(
  body: unknown,
): ValidationOutcome<SpaceAccessGrant> {
  return toValidationOutcome(apartmentGrantSchema.safeParse(body));
}

export function validateUserApartmentRevokeRequest(
  body: unknown,
): ValidationOutcome<SpaceAccessRevoke> {
  return toValidationOutcome(apartmentRevokeSchema.safeParse(body));
}

export function validateUserProSpaceAccessRequest(
  body: unknown,
): ValidationOutcome<SpaceAccessGrant> {
  return toValidationOutcome(proSpaceGrantSchema.safeParse(body));
}

export function validateUserProSpaceRevokeRequest(
  body: unknown,
): ValidationOutcome<SpaceAccessRevoke> {
  return toValidationOutcome(proSpaceRevokeSchema.safeParse(body));
}

import { z } from "zod";
import {
  textField,
  toValidationOutcome,
  type ValidationOutcome,
} from "./shared/fields";
import {
  characteristicsFields,
  connectivityFields,
  dpeFields,
  generalFields,
  heatingAndHotWaterFields,
  landRegistryFields,
} from "./shared/fieldGroups";

const proSpaceKitchenFields = {
  kitchenCabinetsModel: textField(1, 200),
};

export const createProSpaceRequestSchema = z
  .object({
    ...generalFields,
    ...characteristicsFields,
    ...heatingAndHotWaterFields,
    ...proSpaceKitchenFields,
    ...dpeFields,
    ...connectivityFields,
    ...landRegistryFields,
  })
  .strict();

export type ValidatedCreateProSpaceRequest = z.infer<
  typeof createProSpaceRequestSchema
>;

export function validateCreateProSpaceRequest(
  body: unknown,
): ValidationOutcome<ValidatedCreateProSpaceRequest> {
  return toValidationOutcome(createProSpaceRequestSchema.safeParse(body));
}

export const updateProSpaceRequestSchema =
  createProSpaceRequestSchema.partial();

export type ValidatedUpdateProSpaceRequest = z.infer<
  typeof updateProSpaceRequestSchema
>;

export function validateUpdateProSpaceRequest(
  body: unknown,
): ValidationOutcome<ValidatedUpdateProSpaceRequest> {
  return toValidationOutcome(updateProSpaceRequestSchema.safeParse(body));
}

export const setProSpaceAvailabilityRequestSchema = z
  .object({
    isAvailable: z.boolean(),
    revokeAccesses: z.boolean(),
  })
  .strict();

export type SetProSpaceAvailabilityRequest = z.infer<
  typeof setProSpaceAvailabilityRequestSchema
>;

export function validateSetProSpaceAvailabilityRequest(
  body: unknown,
): ValidationOutcome<SetProSpaceAvailabilityRequest> {
  return toValidationOutcome(
    setProSpaceAvailabilityRequestSchema.safeParse(body),
  );
}

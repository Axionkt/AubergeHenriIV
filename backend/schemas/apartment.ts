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

const apartmentKitchenFields = {
  inductionCooktopModel: textField(1, 100),
  ovenModel: textField(1, 100),
  rangeHoodModel: textField(1, 100),
  kitchenCabinetsModel: textField(1, 100),
};

export const createApartmentRequestSchema = z
  .object({
    ...generalFields,
    ...characteristicsFields,
    ...heatingAndHotWaterFields,
    ...apartmentKitchenFields,
    ...dpeFields,
    ...connectivityFields,
    ...landRegistryFields,
  })
  .strict();

export type ValidatedCreateApartmentRequest = z.infer<
  typeof createApartmentRequestSchema
>;

export function validateCreateApartmentRequest(
  body: unknown,
): ValidationOutcome<ValidatedCreateApartmentRequest> {
  return toValidationOutcome(createApartmentRequestSchema.safeParse(body));
}

export const updateApartmentRequestSchema =
  createApartmentRequestSchema.partial();

export type ValidatedUpdateApartmentRequest = z.infer<
  typeof updateApartmentRequestSchema
>;

export function validateUpdateApartmentRequest(
  body: unknown,
): ValidationOutcome<ValidatedUpdateApartmentRequest> {
  return toValidationOutcome(updateApartmentRequestSchema.safeParse(body));
}

export const setApartmentAvailabilityRequestSchema = z
  .object({
    isAvailable: z.boolean(),
    revokeAccesses: z.boolean(),
  })
  .strict();

export type SetApartmentAvailabilityRequest = z.infer<
  typeof setApartmentAvailabilityRequestSchema
>;

export function validateSetApartmentAvailabilityRequest(
  body: unknown,
): ValidationOutcome<SetApartmentAvailabilityRequest> {
  return toValidationOutcome(
    setApartmentAvailabilityRequestSchema.safeParse(body),
  );
}

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

const sharedFields = {
  ...generalFields,
  ...characteristicsFields,
  ...heatingAndHotWaterFields,
  kitchenCabinetsModel: textField(1, 100),
  ...dpeFields,
  ...connectivityFields,
  ...landRegistryFields,
};

const sharedSchema = z.object(sharedFields).strict();
export type SharedSpaceInput = z.infer<typeof sharedSchema>;

/** Builds the create/update validators for one kind of space. */
export function defineSpaceSchemas<TExtra extends z.core.$ZodShape>(
  extraFields: TExtra,
) {
  const createSchema = z.object({ ...sharedFields, ...extraFields }).strict();
  const updateSchema = createSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Au moins un champ doit être fourni.",
    });

  return {
    validateCreate(body: unknown) {
      return toValidationOutcome(createSchema.safeParse(body));
    },
    validateUpdate(body: unknown) {
      return toValidationOutcome(updateSchema.safeParse(body));
    },
  };
}

const setAvailabilitySchema = z
  .object({
    isAvailable: z.boolean(),
    revokeAccesses: z.boolean(),
  })
  .strict();

export type SetSpaceAvailabilityRequest = z.infer<typeof setAvailabilitySchema>;

export function validateSetSpaceAvailabilityRequest(
  body: unknown,
): ValidationOutcome<SetSpaceAvailabilityRequest> {
  return toValidationOutcome(setAvailabilitySchema.safeParse(body));
}

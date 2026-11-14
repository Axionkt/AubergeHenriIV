import { z } from "zod";
import { textField } from "./shared/fields";
import { defineSpaceSchemas } from "./space";

const apartmentExtraFields = {
  inductionCooktopModel: textField(1, 100),
  ovenModel: textField(1, 100),
  rangeHoodModel: textField(1, 100),
};

export type ApartmentExtraInput = z.infer<
  z.ZodObject<typeof apartmentExtraFields>
>;

export const apartmentSchemas = defineSpaceSchemas(apartmentExtraFields);

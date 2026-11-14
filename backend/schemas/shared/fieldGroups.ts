import { z } from "zod";
import {
  decimalField,
  dpeRatingSchema,
  idWithSpaceField,
  richTextField,
  textField,
} from "./fields";

// ---------------------------------------------------------------------------
// Reusable field groups. Each schema spreads the groups it needs and
// adds whatever fields are unique to it. Keeping these as plain objects
// (not z.object() instances) keeps composition simple — just spread
// into whatever object you're building.
//
// String max-lengths and numeric ranges below are aligned to the actual
// Postgres column definitions (VARCHAR(n) / NUMERIC(precision, scale)) so
// nothing that passes validation can fail or get truncated on insert.
// ---------------------------------------------------------------------------

export const generalFields = {
  name: textField(1, 100),
  description: richTextField(1, 5000),
};

export const characteristicsFields = {
  type: textField(1, 50),
  sizeCarrezSqm: decimalField(1, 2000, 2),
  sizeFloorSqm: decimalField(1, 2000, 2),
  floor: textField(1, 50),
  orientation: textField(1, 50),
  view: textField(1, 100),
  hasPrivateExterior: z.boolean(),
  hasPrivateParking: z.boolean(),
};

export const heatingAndHotWaterFields = {
  electricHeatingModel: textField(1, 100),
  bathroomTowelHeaterModel: textField(1, 100),
  electricWaterHeaterModel: textField(1, 100),
};

export const dpeFields = {
  dpeEnergyRating: dpeRatingSchema.nullish(),
  dpeEnergyKwhPerSqmYear: decimalField(1, 9999.99, 2).nullish(),
  dpeEmissionsRating: dpeRatingSchema.nullish(),
  dpeEmissionsKgPerSqmYear: decimalField(1, 9999.99, 2).nullish(),
  previousTenantAnnualConsumptionEur: textField(1, 50).nullish(),
  hasDoubleGlazedWindows: z.boolean(),
  meterPowerKva: decimalField(1, 250, 2),
  deliveryPointId: idWithSpaceField(100),
};

export const connectivityFields = {
  hasFiberOptic: z.boolean(),
  hasCopperNetwork: z.boolean(),
  hasTvOutlet: z.boolean(),
};

export const landRegistryFields = {
  landRegistryRefPre2025: idWithSpaceField(100),
  landRegistryRefPost2025: idWithSpaceField(100),
};

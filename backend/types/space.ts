import type { MediaType } from "../models/Media";
import type { CommonSpaceMediaDTO } from "./commonSpace";
import type { AdminMediaItem, MediaItem } from "./media";

export interface SpaceBase {
  id: string;

  // General
  name: string;
  description: string;
  isAvailable: boolean;

  // Characteristics
  type: string;
  sizeCarrezSqm: number;
  sizeFloorSqm: number;
  floor: string;
  orientation: string;
  view: string;
  hasPrivateExterior: boolean;
  hasPrivateParking: boolean;

  // Heating & Hot Water
  electricHeatingModel: string;
  bathroomTowelHeaterModel: string;
  electricWaterHeaterModel: string;

  // Kitchen
  kitchenCabinetsModel: string;

  // Energy Performance (DPE)
  dpeEnergyRating: string | null;
  dpeEnergyKwhPerSqmYear: number | null;
  dpeEmissionsRating: string | null;
  dpeEmissionsKgPerSqmYear: number | null;
  previousTenantAnnualConsumptionEur: string | null;
  hasDoubleGlazedWindows: boolean;
  meterPowerKva: number;
  deliveryPointId: string;

  // Connectivity
  hasFiberOptic: boolean;
  hasCopperNetwork: boolean;
  hasTvOutlet: boolean;

  // Land Registry
  landRegistryRefPre2025: string;
  landRegistryRefPost2025: string;
}

/** Fields only apartments have. Add a new kind-specific DTO like this one. */
export interface ApartmentExtraDTO {
  inductionCooktopModel: string;
  ovenModel: string;
  rangeHoodModel: string;
}

export interface SpaceDisplay {
  thumbnailUrl: string | null;
  planType: MediaType | null;
  planUrl: string | null;
  photoCount: number;
  videoCount: number;
}

export interface SpaceItemDTO extends Omit<
  SpaceDisplay,
  "planType" | "planUrl"
> {
  id: string;
  name: string;
  type: string;
  sizeCarrezSqm: number;
  floor: string;
  orientation: string;
  view: string;
  isAvailable: boolean;
  hasAccess: boolean;
  accessExpiry: string | null;
}

export type SpaceDetailsDTO<TExtra extends object = object> = SpaceBase &
  TExtra &
  SpaceDisplay & { accessExpiry: string | null };

export interface SpaceItemAdminDTO extends SpaceDisplay {
  id: string;
  name: string;
  isAvailable: boolean;
  userCount: number;
}

export type SpaceDetailsAdminDTO<TExtra extends object = object> = SpaceBase &
  TExtra &
  SpaceDisplay & {
    createdAt: string;
    updatedAt: string;
    userCount: number;
  };

export type SpaceMediaListDTO<T = MediaItem | AdminMediaItem> =
  CommonSpaceMediaDTO<T>;

// Kind-neutral access shapes. The route files map them to the
// apartment-/proSpace-specific DTOs in types/userAccess.ts.
export interface SpaceAccessEntry {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  accessExpiry: string | null;
}

export interface SpaceUserAccess {
  userId: string;
  firstName: string;
  lastName: string;
  spaceId: string;
  spaceName: string;
  accessExpiry: string | null;
}

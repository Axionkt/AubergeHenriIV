import { AdminMediaItem, MediaItem } from "./media";

export interface ApartmentBase {
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
  view?: string;
  hasPrivateExterior: boolean;

  // Heating & Hot Water
  electricHeatingModel?: string;
  bathroomTowelHeaterModel?: string;
  electricWaterHeaterModel?: string;

  // Kitchen
  inductionCooktopModel?: string;
  ovenModel?: string;
  rangeHoodModel?: string;
  kitchenCabinetsModel?: string;

  // Energy Performance (DPE)
  dpeEnergyRating?: string;
  dpeEnergyKwhPerSqmYear?: number;
  dpeEmissionsRating?: string;
  dpeEmissionsKgPerSqmYear?: number;
  previousTenantAnnualConsumptionEur?: number;
  hasDoubleGlazedWindows: boolean;
  meterPowerKva?: number;
  deliveryPointId?: string;

  // Connectivity
  hasFiberOptic: boolean;
  hasCopperNetwork: boolean;
  hasTvOutlet: boolean;

  // Land Registry
  landRegistryRefPre2025?: string;
  landRegistryRefPost2025?: string;
}

export interface ApartmentBaseAdmin extends ApartmentBase {
  createdAt: string;
  updatedAt: string;
}

export interface ApartmentDisplay {
  thumbnailUrl: string | null;
  photoCount: number;
  videoCount: number;
}

export interface ApartmentItem extends ApartmentDisplay {
  id: string;
  name: string;
  type: string;
  floor: string;
  orientation: string;
  view?: string;
  isAvailable: boolean;
  hasAccess: boolean;
  accessExpiry: string | null;
}

export interface ApartmentDetails extends ApartmentBase, ApartmentDisplay {
  isAvailable: boolean;
  accessExpiry: string | null;
}

export interface ApartmentItemAdmin extends ApartmentDisplay {
  id: string;
  name: string;
  isAvailable: boolean;
  userCount: number;
}

export interface ApartmentDetailsAdmin
  extends ApartmentBaseAdmin, ApartmentDisplay {
  userCount: number;
}

export interface ApartmentMediaList<T = MediaItem | AdminMediaItem> {
  media: T[];
}

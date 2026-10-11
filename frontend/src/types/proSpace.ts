import { AdminMediaItem, MediaItem } from "./media";

export interface ProSpaceBase {
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

export interface ProSpaceBaseAdmin extends ProSpaceBase {
  createdAt: string;
  updatedAt: string;
}

export interface ProSpaceDisplay {
  thumbnailUrl: string | null;
  photoCount: number;
  videoCount: number;
}

export interface ProSpaceItem extends ProSpaceDisplay {
  id: string;
  name: string;
  type: string;
  sizeCarrezSqm: number;
  floor: string;
  orientation: string;
  view?: string;
  isAvailable: boolean;
  hasAccess: boolean;
  accessExpiry: string | null;
}

export interface ProSpaceDetails extends ProSpaceBase, ProSpaceDisplay {
  isAvailable: boolean;
  accessExpiry: string | null;
}

export interface ProSpaceItemAdmin extends ProSpaceDisplay {
  id: string;
  name: string;
  isAvailable: boolean;
  userCount: number;
}

export interface ProSpaceDetailsAdmin
  extends ProSpaceBaseAdmin, ProSpaceDisplay {
  userCount: number;
}

export interface ProSpaceMediaList<T = MediaItem | AdminMediaItem> {
  media: T[];
}

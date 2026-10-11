import { AdminMediaItem, MediaItem } from "./media";

interface ProSpaceBase {
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

  // Heating & Hot Water
  electricHeatingModel: string;
  bathroomTowelHeaterModel: string;
  electricWaterHeaterModel: string;

  // Kitchen
  kitchenCabinetsModel: string;

  // Energy Performance (DPE)
  dpeEnergyRating: string;
  dpeEnergyKwhPerSqmYear: number;
  dpeEmissionsRating: string;
  dpeEmissionsKgPerSqmYear: number;
  previousTenantAnnualConsumptionEur: number;
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

export interface ProSpaceBaseAdminDTO extends ProSpaceBase {
  createdAt: string;
  updatedAt: string;
}

interface ProSpaceDisplay {
  thumbnailUrl: string | null;
  photoCount: number;
  videoCount: number;
}

export interface ProSpaceItemDTO extends ProSpaceDisplay {
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

export interface ProSpaceDetailsDTO extends ProSpaceBase, ProSpaceDisplay {
  accessExpiry: string | null;
}

export interface ProSpaceItemAdminDTO extends ProSpaceDisplay {
  id: string;
  name: string;
  isAvailable: boolean;
  userCount: number;
}

export interface ProSpaceDetailsAdminDTO
  extends ProSpaceBaseAdminDTO, ProSpaceDisplay {
  userCount: number;
}

export interface ProSpaceMediaListDTO<T = MediaItem | AdminMediaItem> {
  media: T[];
}

import { QueryKey } from "@tanstack/react-query";

export interface BaseResourceForm {
  // General
  name: string;
  description: string;
  // Characteristics
  type: string;
  sizeCarrezSqm: string;
  sizeFloorSqm: string;
  floor: string;
  orientation: string;
  view: string;
  hasPrivateExterior: boolean;
  // Heating & Hot Water
  electricHeatingModel: string;
  bathroomTowelHeaterModel: string;
  electricWaterHeaterModel: string;
  // DPE
  dpeEnergyRating: string;
  dpeEnergyKwhPerSqmYear: string;
  dpeEmissionsRating: string;
  dpeEmissionsKgPerSqmYear: string;
  previousTenantAnnualConsumptionEur: string;
  hasDoubleGlazedWindows: boolean;
  meterPowerKva: string;
  deliveryPointId: string;
  // Connectivity
  hasFiberOptic: boolean;
  hasCopperNetwork: boolean;
  hasTvOutlet: boolean;
  // Land Registry
  landRegistryRefPre2025: string;
  landRegistryRefPost2025: string;
}

export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T] &
  string;

export interface KitchenFieldConfig<TForm> {
  key: StringKeys<TForm>;
  label: string;
  placeholder?: string;
}

export interface ResourceEditCopy {
  loadingTitle: string;
  loadingBody: string;
  errorTitle: string;
  errorBody: string;
  newTitle: string;
  editTitlePrefix: string;
  nameLabel: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  noMediaText: string;
  requiredNameError: string;
  createSuccess: string;
  updateSuccess: string;
  genericError: string;
  closeButton: string;
  createSuccessThumbnailFailed: string;
}

export interface ResourceEditApiConfig {
  detailUrl: (id: string) => string;
  createUrl: string;
  mediaListUrl: (id: string) => string;
  mediaThumbnailUrl: (id: string) => string;
  mediaBulkUrl: (id: string) => string;
  mediaReorderUrl: (id: string) => string;
}

export interface ResourceEditQueryKeys {
  detail: (id: string) => QueryKey;
  media: (id: string) => QueryKey;
  invalidateOnSave: QueryKey;
}

export interface ResourceDetailsBase {
  name: string;
  thumbnailUrl?: string | null;
}

export interface ResourceEditConfig<
  TDetails extends ResourceDetailsBase,
  TForm extends BaseResourceForm,
> {
  copy: ResourceEditCopy;
  api: ResourceEditApiConfig;
  queryKeys: ResourceEditQueryKeys;
  emptyForm: TForm;
  toForm: (details: TDetails) => TForm;
  toPayload: (form: TForm) => Record<string, unknown>;
  kitchenFields: KitchenFieldConfig<TForm>[];
}

import type { SpaceRow } from "../../models/Space";
import type { SharedSpaceInput } from "../../schemas/space";
import type { SpaceBase } from "../../types/space";

export function toSpaceBase(row: SpaceRow): SpaceBase {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isAvailable: row.is_available,
    type: row.type,
    sizeCarrezSqm: row.size_carrez_sqm,
    sizeFloorSqm: row.size_floor_sqm,
    floor: row.floor,
    orientation: row.orientation,
    view: row.view,
    hasPrivateExterior: row.has_private_exterior,
    hasPrivateParking: row.has_private_parking,
    electricHeatingModel: row.electric_heating_model,
    bathroomTowelHeaterModel: row.bathroom_towel_heater_model,
    electricWaterHeaterModel: row.electric_water_heater_model,
    kitchenCabinetsModel: row.kitchen_cabinets_model,
    dpeEnergyRating: row.dpe_energy_rating,
    dpeEnergyKwhPerSqmYear: row.dpe_energy_kwh_per_sqm_year,
    dpeEmissionsRating: row.dpe_emissions_rating,
    dpeEmissionsKgPerSqmYear: row.dpe_emissions_kg_per_sqm_year,
    previousTenantAnnualConsumptionEur:
      row.previous_tenant_annual_consumption_eur,
    hasDoubleGlazedWindows: row.has_double_glazed_windows,
    meterPowerKva: row.meter_power_kva,
    deliveryPointId: row.delivery_point_id,
    hasFiberOptic: row.has_fiber_optic,
    hasCopperNetwork: row.has_copper_network,
    hasTvOutlet: row.has_tv_outlet,
    landRegistryRefPre2025: row.land_registry_ref_pre_2025,
    landRegistryRefPost2025: row.land_registry_ref_post_2025,
  };
}

/** Column names come from this fixed list, never from request keys. */
export function sharedToDB(
  data: Partial<SharedSpaceInput>,
): Record<string, unknown> {
  return {
    name: data.name,
    description: data.description,
    type: data.type,
    size_carrez_sqm: data.sizeCarrezSqm,
    size_floor_sqm: data.sizeFloorSqm,
    floor: data.floor,
    orientation: data.orientation,
    view: data.view,
    has_private_exterior: data.hasPrivateExterior,
    has_private_parking: data.hasPrivateParking,
    electric_heating_model: data.electricHeatingModel,
    bathroom_towel_heater_model: data.bathroomTowelHeaterModel,
    electric_water_heater_model: data.electricWaterHeaterModel,
    kitchen_cabinets_model: data.kitchenCabinetsModel,
    dpe_energy_rating: data.dpeEnergyRating,
    dpe_energy_kwh_per_sqm_year: data.dpeEnergyKwhPerSqmYear,
    dpe_emissions_rating: data.dpeEmissionsRating,
    dpe_emissions_kg_per_sqm_year: data.dpeEmissionsKgPerSqmYear,
    previous_tenant_annual_consumption_eur:
      data.previousTenantAnnualConsumptionEur,
    has_double_glazed_windows: data.hasDoubleGlazedWindows,
    meter_power_kva: data.meterPowerKva,
    delivery_point_id: data.deliveryPointId,
    has_fiber_optic: data.hasFiberOptic,
    has_copper_network: data.hasCopperNetwork,
    has_tv_outlet: data.hasTvOutlet,
    land_registry_ref_pre_2025: data.landRegistryRefPre2025,
    land_registry_ref_post_2025: data.landRegistryRefPost2025,
  };
}

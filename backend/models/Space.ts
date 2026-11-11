export interface SpaceRow {
  id: string;

  // General
  name: string;
  description: string;
  is_available: boolean;

  // Characteristics
  type: string;
  size_carrez_sqm: number;
  size_floor_sqm: number;
  floor: string;
  orientation: string;
  view: string;
  has_private_exterior: boolean;
  has_private_parking: boolean;

  // Heating & Hot Water
  electric_heating_model: string;
  bathroom_towel_heater_model: string;
  electric_water_heater_model: string;

  // Kitchen (shared)
  kitchen_cabinets_model: string;

  // Energy Performance (DPE)
  dpe_energy_rating: string | null;
  dpe_energy_kwh_per_sqm_year: number | null;
  dpe_emissions_rating: string | null;
  dpe_emissions_kg_per_sqm_year: number | null;
  previous_tenant_annual_consumption_eur: string | null;
  has_double_glazed_windows: boolean;
  meter_power_kva: number;
  delivery_point_id: string;

  // Connectivity
  has_fiber_optic: boolean;
  has_copper_network: boolean;
  has_tv_outlet: boolean;

  // Land Registry
  land_registry_ref_pre_2025: string;
  land_registry_ref_post_2025: string;

  created_at: Date;
  updated_at: Date;
}

export interface ApartmentRow extends SpaceRow {
  induction_cooktop_model: string;
  oven_model: string;
  range_hood_model: string;
}

export type ProSpaceRow = SpaceRow;

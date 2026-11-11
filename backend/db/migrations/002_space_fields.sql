-- Unit fields v2, same change on both kinds of unit:
--   * has_private_parking is new;
--   * energy (DPE) figures are optional: not every unit has a diagnosis;
--   * the previous tenant's consumption is free text (e.g. "~900 €/an"),
--     existing amounts are kept as their text form.

ALTER TABLE Apartments
    ADD COLUMN has_private_parking BOOLEAN NOT NULL DEFAULT FALSE,
    ALTER COLUMN dpe_energy_rating DROP NOT NULL,
    ALTER COLUMN dpe_energy_kwh_per_sqm_year DROP NOT NULL,
    ALTER COLUMN dpe_emissions_rating DROP NOT NULL,
    ALTER COLUMN dpe_emissions_kg_per_sqm_year DROP NOT NULL,
    ALTER COLUMN previous_tenant_annual_consumption_eur DROP NOT NULL,
    ALTER COLUMN previous_tenant_annual_consumption_eur TYPE VARCHAR(50)
        USING previous_tenant_annual_consumption_eur::text;

ALTER TABLE ProSpaces
    ADD COLUMN has_private_parking BOOLEAN NOT NULL DEFAULT FALSE,
    ALTER COLUMN dpe_energy_rating DROP NOT NULL,
    ALTER COLUMN dpe_energy_kwh_per_sqm_year DROP NOT NULL,
    ALTER COLUMN dpe_emissions_rating DROP NOT NULL,
    ALTER COLUMN dpe_emissions_kg_per_sqm_year DROP NOT NULL,
    ALTER COLUMN previous_tenant_annual_consumption_eur DROP NOT NULL,
    ALTER COLUMN previous_tenant_annual_consumption_eur TYPE VARCHAR(50)
        USING previous_tenant_annual_consumption_eur::text;

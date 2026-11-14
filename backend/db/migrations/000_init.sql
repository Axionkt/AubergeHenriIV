-- DEFINE TYPES
CREATE TYPE media_context AS ENUM ('apartment', 'pro-space', 'common-space');
CREATE TYPE media_type AS ENUM ('image', 'video');

-- INIT TABLES
CREATE TABLE IF NOT EXISTS Users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMPTZ,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMPTZ,
    is_google_auth BOOLEAN NOT NULL DEFAULT FALSE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Apartments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- General
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT FALSE,

    -- Characteristics
    type VARCHAR(50) NOT NULL,
    size_carrez_sqm NUMERIC(6,2) NOT NULL,
    size_floor_sqm NUMERIC(6,2) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    orientation VARCHAR(50) NOT NULL,
    view VARCHAR(100) NOT NULL,
    has_private_exterior BOOLEAN NOT NULL DEFAULT FALSE,

    -- Heating & Hot Water
    electric_heating_model VARCHAR(100) NOT NULL,
    bathroom_towel_heater_model VARCHAR(100) NOT NULL,
    electric_water_heater_model VARCHAR(100) NOT NULL,

    -- Kitchen
    induction_cooktop_model VARCHAR(100) NOT NULL,
    oven_model VARCHAR(100) NOT NULL,
    range_hood_model VARCHAR(100) NOT NULL,
    kitchen_cabinets_model VARCHAR(100) NOT NULL,

    -- Energy Performance (DPE)
    dpe_energy_rating VARCHAR(2) NOT NULL,
    dpe_energy_kwh_per_sqm_year NUMERIC(6,2) NOT NULL,
    dpe_emissions_rating VARCHAR(2) NOT NULL,
    dpe_emissions_kg_per_sqm_year NUMERIC(6,2) NOT NULL,
    previous_tenant_annual_consumption_eur NUMERIC(8,2) NOT NULL,
    has_double_glazed_windows BOOLEAN NOT NULL DEFAULT FALSE,
    meter_power_kva NUMERIC(5,2) NOT NULL,
    delivery_point_id VARCHAR(100) NOT NULL,

    -- Connectivity
    has_fiber_optic BOOLEAN NOT NULL DEFAULT FALSE,
    has_copper_network BOOLEAN NOT NULL DEFAULT FALSE,
    has_tv_outlet BOOLEAN NOT NULL DEFAULT FALSE,

    -- Land Registry (Référence foncière)
    land_registry_ref_pre_2025 VARCHAR(100) NOT NULL,
    land_registry_ref_post_2025 VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ProSpaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- General
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT FALSE,

    -- Characteristics
    type VARCHAR(50) NOT NULL,
    size_carrez_sqm NUMERIC(6,2) NOT NULL,
    size_floor_sqm NUMERIC(6,2) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    orientation VARCHAR(50) NOT NULL,
    view VARCHAR(100) NOT NULL,
    has_private_exterior BOOLEAN NOT NULL DEFAULT FALSE,

    -- Heating & Hot Water
    electric_heating_model VARCHAR(100) NOT NULL,
    bathroom_towel_heater_model VARCHAR(100) NOT NULL,
    electric_water_heater_model VARCHAR(100) NOT NULL,

    -- Kitchen
    kitchen_cabinets_model VARCHAR(100) NOT NULL,

    -- Energy Performance (DPE)
    dpe_energy_rating VARCHAR(2) NOT NULL,
    dpe_energy_kwh_per_sqm_year NUMERIC(6,2) NOT NULL,
    dpe_emissions_rating VARCHAR(2) NOT NULL,
    dpe_emissions_kg_per_sqm_year NUMERIC(6,2) NOT NULL,
    previous_tenant_annual_consumption_eur NUMERIC(8,2) NOT NULL,
    has_double_glazed_windows BOOLEAN NOT NULL DEFAULT FALSE,
    meter_power_kva NUMERIC(5,2) NOT NULL,
    delivery_point_id VARCHAR(100) NOT NULL,

    -- Connectivity
    has_fiber_optic BOOLEAN NOT NULL DEFAULT FALSE,
    has_copper_network BOOLEAN NOT NULL DEFAULT FALSE,
    has_tv_outlet BOOLEAN NOT NULL DEFAULT FALSE,

    -- Land Registry (Référence foncière)
    land_registry_ref_pre_2025 VARCHAR(100) NOT NULL,
    land_registry_ref_post_2025 VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INT NOT NULL,
    context media_context NOT NULL,
    context_id UUID,
    type media_type NOT NULL,
    is_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS UserApartmentAccess (
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    apartment_id UUID REFERENCES Apartments(id) ON DELETE CASCADE,
    access_expiry TIMESTAMPTZ,
    PRIMARY KEY (user_id, apartment_id)
);

CREATE TABLE IF NOT EXISTS UserProSpaceAccess (
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    pro_space_id UUID REFERENCES ProSpaces(id) ON DELETE CASCADE,
    access_expiry TIMESTAMPTZ,
    PRIMARY KEY (user_id, pro_space_id)
);

CREATE TABLE IF NOT EXISTS Reviews (
    id SERIAL PRIMARY KEY,
    author_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFINE INDEXES
CREATE INDEX media_context_idx ON Media (context, context_id);
CREATE UNIQUE INDEX media_thumbnail_idx ON Media (context, context_id) WHERE is_thumbnail = TRUE;

-- DEFINE CRON JOBS
CREATE OR REPLACE FUNCTION flush_expired_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM users
    WHERE email_verified = FALSE
      AND email_verification_expires IS NOT NULL
      AND email_verification_expires < NOW();

    DELETE FROM UserApartmentAccess
    WHERE access_expiry IS NOT NULL
      AND access_expiry < NOW();

    DELETE FROM UserProSpaceAccess
    WHERE access_expiry IS NOT NULL
      AND access_expiry < NOW();
END;
$$;
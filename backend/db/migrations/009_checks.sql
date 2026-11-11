-- Validate DPE energy ratings.
ALTER TABLE Apartments
ADD CONSTRAINT apartments_dpe_energy_rating_chk
CHECK (dpe_energy_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'));

ALTER TABLE ProSpaces
ADD CONSTRAINT pro_spaces_dpe_energy_rating_chk
CHECK (dpe_energy_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'));


-- Validate DPE emissions ratings.
ALTER TABLE Apartments
ADD CONSTRAINT apartments_dpe_emissions_rating_chk
CHECK (dpe_emissions_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'));

ALTER TABLE ProSpaces
ADD CONSTRAINT pro_spaces_dpe_emissions_rating_chk
CHECK (dpe_emissions_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'));


-- Validate property sizes.
ALTER TABLE Apartments
ADD CONSTRAINT apartments_sizes_positive_chk
CHECK (size_carrez_sqm > 0 AND size_floor_sqm > 0);

ALTER TABLE ProSpaces
ADD CONSTRAINT pro_spaces_sizes_positive_chk
CHECK (size_carrez_sqm > 0 AND size_floor_sqm > 0);
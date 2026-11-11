-- The composite primary keys (user_id, space_id) don't serve lookups by
-- space alone (counts, user lists, revoke-all, cascades).
CREATE INDEX IF NOT EXISTS user_apartment_access_apartment_idx
    ON UserApartmentAccess (apartment_id);
CREATE INDEX IF NOT EXISTS user_pro_space_access_pro_space_idx
    ON UserProSpaceAccess (pro_space_id);

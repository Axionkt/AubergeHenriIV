-- The runner wraps each migration in a transaction: no BEGIN/COMMIT here.
-- Table names are unquoted on purpose: init created them unquoted, so
-- Postgres stores them lowercase ("Users" in quotes would not match).

UPDATE Users SET is_admin = FALSE WHERE is_admin IS NULL;
UPDATE Users SET created_at = NOW() WHERE created_at IS NULL;

ALTER TABLE Users
    ALTER COLUMN is_admin SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

UPDATE Reviews SET created_at = NOW() WHERE created_at IS NULL;
UPDATE Reviews SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE Reviews
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

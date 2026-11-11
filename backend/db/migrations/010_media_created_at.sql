-- created_at had a default but allowed NULL; the code calls toISOString() on it.
UPDATE Media SET created_at = NOW() WHERE created_at IS NULL;
ALTER TABLE Media ALTER COLUMN created_at SET NOT NULL;

-- Bumped on password reset so every outstanding refresh token stops working.
ALTER TABLE Users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

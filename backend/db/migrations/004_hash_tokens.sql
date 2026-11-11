-- Tokens are now stored as SHA-256 hex digests (see utils/hashToken.ts).
-- sha256() is built into Postgres 11+, so no pgcrypto extension is needed.

-- Hash pending verification tokens so links already sent keep working.
UPDATE Users
SET email_verification_token =
    encode(sha256(convert_to(email_verification_token, 'UTF8')), 'hex')
WHERE email_verification_token IS NOT NULL;

-- Reset links are short-lived: invalidate them instead of migrating.
UPDATE Users
SET password_reset_token = NULL,
    password_reset_expires = NULL
WHERE password_reset_token IS NOT NULL
   OR password_reset_expires IS NOT NULL;

-- Token lookups were full scans; these also forbid duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_verification_token_idx
    ON Users (email_verification_token)
    WHERE email_verification_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_password_reset_token_idx
    ON Users (password_reset_token)
    WHERE password_reset_token IS NOT NULL;

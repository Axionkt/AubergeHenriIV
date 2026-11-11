-- Emails are compared lowercase everywhere (Zod lowercases on input).
-- Before applying on an existing database, check for case-duplicates:
--   SELECT lower(email) FROM Users GROUP BY 1 HAVING count(*) > 1;
UPDATE Users SET email = lower(email);
ALTER TABLE Users ALTER COLUMN email TYPE VARCHAR(254);
ALTER TABLE Users ADD CONSTRAINT users_email_lower CHECK (email = lower(email));

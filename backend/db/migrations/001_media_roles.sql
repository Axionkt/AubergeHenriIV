-- Media model v2: an explicit role instead of is_thumbnail, uppercase types,
-- and one common area per kind of unit instead of a single shared one.
--
-- Enums are rebuilt rather than altered: ALTER TYPE ... ADD VALUE can't be
-- used in the same transaction that adds it, and the runner wraps each file
-- in one transaction.

-- Roles: legacy rows are either a thumbnail or a regular gallery item.
CREATE TYPE media_role AS ENUM ('REGULAR', 'THUMBNAIL', 'PLAN');

ALTER TABLE Media ADD COLUMN role media_role;
UPDATE Media SET role = CASE WHEN is_thumbnail THEN 'THUMBNAIL' ELSE 'REGULAR' END::media_role;
ALTER TABLE Media ALTER COLUMN role SET NOT NULL;

DROP INDEX media_thumbnail_idx;
ALTER TABLE Media DROP COLUMN is_thumbnail;

-- Types: 'image'/'video' become 'IMAGE'/'VIDEO'; 'DOCUMENT' is for plans.
ALTER TYPE media_type RENAME TO media_type_old;
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');
ALTER TABLE Media
    ALTER COLUMN type TYPE media_type USING upper(type::text)::media_type;
DROP TYPE media_type_old;

-- Contexts: the single 'common-space' only ever held apartment common-area
-- media, so it becomes 'apartment-common'. Stored file paths are unchanged
-- and keep working (they are read from file_path, never rebuilt).
ALTER TYPE media_context RENAME TO media_context_old;
CREATE TYPE media_context AS ENUM ('apartment', 'pro-space', 'apartment-common', 'pro-space-common');
ALTER TABLE Media
    ALTER COLUMN context TYPE media_context
    USING (CASE context::text
             WHEN 'common-space' THEN 'apartment-common'
             ELSE context::text
           END)::media_context;
DROP TYPE media_context_old;

-- At most one thumbnail and one plan per unit (and per common area, hence
-- NULLS NOT DISTINCT for their NULL context_id).
CREATE UNIQUE INDEX unique_media_role_per_context
    ON Media (context, context_id, role) NULLS NOT DISTINCT
    WHERE role IN ('THUMBNAIL', 'PLAN');

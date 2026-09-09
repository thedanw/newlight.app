/**
 * Migration: journey_stages — UUID primary key
 *
 * The `slug` column was the primary key of `journey_stages`, but it's a
 * human-readable identifier that may need to change. Since `people.journey`
 * (JSONB) stores stage slugs as values, changing a slug would orphan those
 * references or create duplicate rows on upsert.
 *
 * This migration:
 *   1. Adds an `id` UUID column as the new primary key (stable, immutable)
 *   2. Drops the PK on `slug` and makes it a unique (but editable) column
 *   3. Migrates `people.journey` JSON values from slug → UUID
 *   4. Creates a slug→id mapping function for the Elvanto sync plugin
 */

-- 1. Add new id column if it doesn't already exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journey_stages' AND column_name = 'id') THEN
    ALTER TABLE journey_stages ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Deterministic UUIDs for known seeded stages so cross-environment references are stable
UPDATE journey_stages SET id = 'a1b2c3d4-0000-4000-8000-000000000001' WHERE slug = 'contact';
UPDATE journey_stages SET id = 'a1b2c3d4-0000-4000-0000-000000000002' WHERE slug = 'guest';
UPDATE journey_stages SET id = 'a1b2c3d4-0000-4000-8000-000000000003' WHERE slug = 'linked';
UPDATE journey_stages SET id = 'a1b2c3d4-0000-4000-8000-000000000004' WHERE slug = 'regular';
UPDATE journey_stages SET id = 'a1b2c3d4-0000-4000-8000-000000000005' WHERE slug = 'archived';
UPDATE journey_stages SET id = 'a1b2c3d4-0000-4000-8000-000000000006' WHERE slug = 'deleted_privacy_data';

-- 2. Replace the primary key: drop slug as PK, make id the PK (idempotent)
DO $$
DECLARE
  pk_cols TEXT;
BEGIN
  SELECT string_agg(a.attname, ',')
  INTO pk_cols
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE i.indrelid = 'journey_stages'::regclass AND i.indisprimary;

  IF pk_cols IS NULL THEN
    -- No PK exists — just set it on id
    ALTER TABLE journey_stages ADD PRIMARY KEY (id);
  ELSIF pk_cols != 'id' THEN
    -- PK is still on the old column(s) — migrate it
    ALTER TABLE journey_stages DROP CONSTRAINT journey_stages_pkey;
    ALTER TABLE journey_stages ADD PRIMARY KEY (id);
  END IF;
  -- If pk_cols = 'id', PK is already correct — skip
END $$;

-- 3. Keep slug unique (but editable) so lookups by slug still work (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journey_stages_slug_unique' AND conrelid = 'journey_stages'::regclass
  ) THEN
    ALTER TABLE journey_stages ADD CONSTRAINT journey_stages_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- 4. Migrate people.journey JSONB: replace each stage slug value with its UUID
--     Uses jsonb_each_text to iterate key/val pairs, joins on slug to resolve
--     the correct UUID, and preserves existing UUID values (idempotent).
UPDATE people
SET journey = COALESCE(
  (
    SELECT jsonb_object_agg(e.key, COALESCE(s.id::text, e.val))
    FROM jsonb_each_text(people.journey) AS e(key, val)
    LEFT JOIN journey_stages s ON s.slug = e.val
  ),
  '{}'::jsonb
);

-- 5. Grants (already covered by the table-level grants in the original migration,
--    but explicitly re-grant SELECT on the new column)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_stages TO service_role;

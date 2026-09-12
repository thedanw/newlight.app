-- Form Builder Extensions: multi-column layout + conditional logic
-- Extends the existing forms schema with new field properties and conditions table

-- Add new field types for enhanced form builder.
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block
-- (Supabase runs migrations in a transaction), so insert into pg_enum
-- directly via a guarded DO block instead. Idempotent on re-apply.
DO $$ BEGIN
  INSERT INTO pg_enum (enumtypid, enumlabel, enumsortorder)
  SELECT t.oid, label, (SELECT MAX(enumsortorder) + 1 FROM pg_enum WHERE enumtypid = t.oid)
  FROM pg_type t CROSS JOIN (VALUES ('title'), ('radio'), ('scale'), ('nps'), ('column_container')) AS v(label)
  WHERE t.typname = 'form_field_type'
    AND NOT EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumtypid = t.oid AND e.enumlabel = v.label);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- New enum for condition operators (guarded: plain CREATE TYPE fails on re-apply)
DO $$ BEGIN
  CREATE TYPE form_condition_operator AS enum ('equals', 'not_equals', 'greater_than', 'less_than', 'contains');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- New enum for condition effects
DO $$ BEGIN
  CREATE TYPE form_condition_effect AS enum ('show', 'hide', 'require');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend form_fields with builder-specific columns
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS min_value INTEGER;
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS max_value INTEGER;
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS column_span INTEGER NOT NULL DEFAULT 12;
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES form_fields (id) ON DELETE CASCADE;

-- Table for conditional visibility/requirement rules
CREATE TABLE IF NOT EXISTS form_field_conditions (
  id UUID PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms (id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields (id) ON DELETE CASCADE,
  source_field_id UUID NOT NULL REFERENCES form_fields (id) ON DELETE CASCADE,
  operator form_condition_operator NOT NULL,
  value TEXT NOT NULL,
  effect form_condition_effect NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast condition lookups by form
CREATE INDEX IF NOT EXISTS form_field_conditions_form_id_idx ON form_field_conditions (form_id);

-- Index for fast condition lookups by target field
CREATE INDEX IF NOT EXISTS form_field_conditions_field_id_idx ON form_field_conditions (field_id);

-- Grants follow the existing forms-tables convention (see
-- 20260907000001_fix_production_grants_for_app_tables.sql): no RLS on forms
-- tables, authenticated + service_role get full access.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_field_conditions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_field_conditions TO service_role;
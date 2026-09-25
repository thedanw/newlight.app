-- Form Builder Extensions: multi-column layout + conditional logic
-- Extends the existing forms schema with new field properties and conditions table

-- NOTE: New enum values for form_field_type are added in a separate migration
-- (20260909000001_form_field_type_extensions.sql) because ALTER TYPE ... ADD VALUE
-- cannot run inside a transaction block (Supabase runs migrations in a transaction).
-- That migration must be applied separately via Supabase Dashboard or CLI.

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
-- Form Field Type Extensions: Add new field types for enhanced form builder
-- This migration MUST be run outside of a transaction block because
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction.
-- Run this separately via Supabase Dashboard SQL Editor or:
--   supabase db push --include-all --dry-run
-- Then copy the ALTER TYPE statements and run them manually in the Dashboard.

-- Add new field types for enhanced form builder
-- These are idempotent - they will fail silently if the value already exists
-- (PostgreSQL 15+ supports IF NOT EXISTS for ALTER TYPE ADD VALUE)

-- For PostgreSQL 15+:
-- ALTER TYPE form_field_type ADD VALUE IF NOT EXISTS 'title';
-- ALTER TYPE form_field_type ADD VALUE IF NOT EXISTS 'radio';
-- ALTER TYPE form_field_type ADD VALUE IF NOT EXISTS 'scale';
-- ALTER TYPE form_field_type ADD VALUE IF NOT EXISTS 'nps';
-- ALTER TYPE form_field_type ADD VALUE IF NOT EXISTS 'column_container';

-- For PostgreSQL 14 and earlier (compatible approach):
-- Use DO blocks with exception handling for idempotency

DO $$ BEGIN
  ALTER TYPE form_field_type ADD VALUE 'title';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE form_field_type ADD VALUE 'radio';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE form_field_type ADD VALUE 'scale';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE form_field_type ADD VALUE 'nps';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE form_field_type ADD VALUE 'column_container';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Migration: Revoke anon writes on settings, plugins, elvanto tables
-- Batch 2: Close anon write surfaces for PII and configuration data
-- Idempotent: drop-then-create style with IF EXISTS

-- Revoke all write operations from anon on platform_settings
REVOKE INSERT, UPDATE, DELETE ON public.platform_settings FROM anon;
DROP POLICY IF EXISTS "anon_insert_platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "anon_update_platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "anon_delete_platform_settings" ON public.platform_settings;

-- Revoke all write operations from anon on plugins
REVOKE INSERT, UPDATE, DELETE ON public.plugins FROM anon;
DROP POLICY IF EXISTS "anon_insert_plugins" ON public.plugins;
DROP POLICY IF EXISTS "anon_update_plugins" ON public.plugins;
DROP POLICY IF EXISTS "anon_delete_plugins" ON public.plugins;

-- Revoke all write operations from anon on elvanto_settings
REVOKE INSERT, UPDATE, DELETE ON public.elvanto_settings FROM anon;
DROP POLICY IF EXISTS "anon_insert_elvanto_settings" ON public.elvanto_settings;
DROP POLICY IF EXISTS "anon_update_elvanto_settings" ON public.elvanto_settings;
DROP POLICY IF EXISTS "anon_delete_elvanto_settings" ON public.elvanto_settings;

-- Revoke all write operations from anon on elvanto_sync_config
REVOKE INSERT, UPDATE, DELETE ON public.elvanto_sync_config FROM anon;
DROP POLICY IF EXISTS "anon_insert_elvanto_sync_config" ON public.elvanto_sync_config;
DROP POLICY IF EXISTS "anon_update_elvanto_sync_config" ON public.elvanto_sync_config;
DROP POLICY IF EXISTS "anon_delete_elvanto_sync_config" ON public.elvanto_sync_config;

-- Revoke all write operations from anon on elvanto_sync_dead_letter
REVOKE INSERT, UPDATE, DELETE ON public.elvanto_sync_dead_letter FROM anon;
DROP POLICY IF EXISTS "anon_insert_elvanto_sync_dead_letter" ON public.elvanto_sync_dead_letter;
DROP POLICY IF EXISTS "anon_update_elvanto_sync_dead_letter" ON public.elvanto_sync_dead_letter;
DROP POLICY IF EXISTS "anon_delete_elvanto_sync_dead_letter" ON public.elvanto_sync_dead_letter;

-- Comment: Interim state — members lose settings writes until batch 6 super-admin policies are applied
-- This is safe as per audit §5 guardrail; super-admin replacements land in batch 6
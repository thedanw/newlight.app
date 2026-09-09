-- Fix authenticated RLS for Elvanto Sync plugin tables
-- The app runs with an authenticated session, but the elvanto plugin tables
-- only had `anon` policies (from 20260829150000) plus the original
-- super_admin/admin policies. When authenticated, `anon` policies don't
-- apply and there were no `authenticated` INSERT/UPDATE policies, causing:
--   new row violates row-level security policy for table "elvanto_sync_config" (42501)
-- Idempotent: drops existing policies before recreating.

-- ============================================
-- elvanto_settings: authenticated read/write
-- ============================================
DROP POLICY IF EXISTS "Authenticated read settings" ON public.elvanto_settings;
CREATE POLICY "Authenticated read settings"
  ON public.elvanto_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated write settings" ON public.elvanto_settings;
CREATE POLICY "Authenticated write settings"
  ON public.elvanto_settings FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update settings" ON public.elvanto_settings;
CREATE POLICY "Authenticated update settings"
  ON public.elvanto_settings FOR UPDATE TO authenticated USING (true);

-- ============================================
-- elvanto_sync_config: authenticated read/write
-- ============================================
DROP POLICY IF EXISTS "Authenticated read config" ON public.elvanto_sync_config;
CREATE POLICY "Authenticated read config"
  ON public.elvanto_sync_config FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated write config" ON public.elvanto_sync_config;
CREATE POLICY "Authenticated write config"
  ON public.elvanto_sync_config FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update config" ON public.elvanto_sync_config;
CREATE POLICY "Authenticated update config"
  ON public.elvanto_sync_config FOR UPDATE TO authenticated USING (true);

-- ============================================
-- elvanto_sync_history: authenticated read
-- ============================================
DROP POLICY IF EXISTS "Authenticated read history" ON public.elvanto_sync_history;
CREATE POLICY "Authenticated read history"
  ON public.elvanto_sync_history FOR SELECT TO authenticated USING (true);

-- ============================================
-- elvanto_sync_dead_letter: authenticated read
-- ============================================
DROP POLICY IF EXISTS "Authenticated read dead letter" ON public.elvanto_sync_dead_letter;
CREATE POLICY "Authenticated read dead letter"
  ON public.elvanto_sync_dead_letter FOR SELECT TO authenticated USING (true);
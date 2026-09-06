-- Fix missing RLS policies and GRANTs for production
-- Idempotent: safe to re-apply

-- ============================================
-- saved_lists: completely missing GRANT and RLS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_lists TO authenticated;
GRANT SELECT ON public.saved_lists TO anon;

ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read saved_lists" ON saved_lists;
CREATE POLICY "Authenticated read saved_lists" ON saved_lists
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR is_shared = true);

DROP POLICY IF EXISTS "Authenticated insert saved_lists" ON saved_lists;
CREATE POLICY "Authenticated insert saved_lists" ON saved_lists
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated update saved_lists" ON saved_lists;
CREATE POLICY "Authenticated update saved_lists" ON saved_lists
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated delete saved_lists" ON saved_lists;
CREATE POLICY "Authenticated delete saved_lists" ON saved_lists
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ============================================
-- platform_settings: ensure RLS and GRANTs
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO anon;

DROP POLICY IF EXISTS "Public read access" ON platform_settings;
CREATE POLICY "Public read access" ON platform_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon write settings" ON platform_settings;
CREATE POLICY "Anon write settings"
  ON platform_settings
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update settings" ON platform_settings;
CREATE POLICY "Anon update settings"
  ON platform_settings
  FOR UPDATE
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated write settings" ON platform_settings;
CREATE POLICY "Authenticated write settings"
  ON platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update settings" ON platform_settings;
CREATE POLICY "Authenticated update settings"
  ON platform_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- people: ensure RLS and GRANTs
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO authenticated;
GRANT SELECT ON public.people TO anon;

DROP POLICY IF EXISTS "Public read access" ON people;
CREATE POLICY "Public read access" ON people
  FOR SELECT TO anon
  USING (deleted_at is null AND access_permission = 'public');

DROP POLICY IF EXISTS "Authenticated read access" ON people;
CREATE POLICY "Authenticated read access" ON people
  FOR SELECT TO authenticated
  USING (deleted_at is null);

-- ============================================
-- tags: ensure RLS and GRANTs
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT SELECT ON public.tags TO anon;

DROP POLICY IF EXISTS "Public read access" ON tags;
CREATE POLICY "Public read access" ON tags
  FOR SELECT USING (true);

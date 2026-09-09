-- Fix missing RLS policies and GRANTs for people_tags in production.
-- The 20260906000001 fix migration covered saved_lists, platform_settings,
-- people, and tags but overlooked people_tags, so authenticated reads
-- (e.g. person profile tag loading) return 403 Forbidden.
-- Idempotent: safe to re-apply.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_tags TO authenticated;
GRANT SELECT ON public.people_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_tags TO service_role;

ALTER TABLE people_tags ENABLE ROW LEVEL SECURITY;

-- Read: everyone can read tag links (matches original "Public read access" design)
DROP POLICY IF EXISTS "Public read access" ON people_tags;
CREATE POLICY "Public read access" ON people_tags
  FOR SELECT USING (true);

-- Write: authenticated users manage tag links (matches people_relationships fix)
DROP POLICY IF EXISTS "Authenticated insert people_tags" ON people_tags;
CREATE POLICY "Authenticated insert people_tags" ON people_tags
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update people_tags" ON people_tags;
CREATE POLICY "Authenticated update people_tags" ON people_tags
  FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated delete people_tags" ON people_tags;
CREATE POLICY "Authenticated delete people_tags" ON people_tags
  FOR DELETE TO authenticated
  USING (true);
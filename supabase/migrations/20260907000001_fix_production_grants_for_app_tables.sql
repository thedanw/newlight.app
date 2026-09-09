-- Fix missing GRANTs (and RLS write policies where the app writes) for the
-- remaining app tables in production.
--
-- The production DB was set up manually: the original migrations' GRANT
-- statements were never executed for most tables, so the `authenticated`
-- role only has REFERENCES/TRIGGER/TRUNCATE/MAINTAIN (no SELECT/INSERT/
-- UPDATE/DELETE) and reads/writes return 403 Forbidden. The 20260906000001
-- fix migration covered saved_lists, platform_settings, people, and tags;
-- this one covers the rest of the tables the app queries.
-- Idempotent: safe to re-apply.

-- ============================================
-- addresses: RLS enabled (public read policy exists), missing grants + write policies
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT ON public.addresses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO service_role;

DROP POLICY IF EXISTS "Authenticated insert addresses" ON addresses;
CREATE POLICY "Authenticated insert addresses" ON addresses
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update addresses" ON addresses;
CREATE POLICY "Authenticated update addresses" ON addresses
  FOR UPDATE TO authenticated USING (true);

-- ============================================
-- households: RLS enabled (public read policy exists), missing grants + write policies
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO authenticated;
GRANT SELECT ON public.households TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO service_role;

DROP POLICY IF EXISTS "Authenticated insert households" ON households;
CREATE POLICY "Authenticated insert households" ON households
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- journey_tracks: RLS enabled (public read policy exists), missing grants + write policies
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_tracks TO service_role;

DROP POLICY IF EXISTS "Authenticated insert journey_tracks" ON journey_tracks;
CREATE POLICY "Authenticated insert journey_tracks" ON journey_tracks
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update journey_tracks" ON journey_tracks;
CREATE POLICY "Authenticated update journey_tracks" ON journey_tracks
  FOR UPDATE TO authenticated USING (true);

-- ============================================
-- people_relationships: RLS enabled (public read policy exists), missing grants
-- (write policies added separately in 20260906215800)
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_relationships TO authenticated;
GRANT SELECT ON public.people_relationships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_relationships TO service_role;

-- ============================================
-- Non-RLS tables: missing grants only (no policies needed)
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_stages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_track_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_track_categories TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_audit TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_fields TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submissions TO service_role;
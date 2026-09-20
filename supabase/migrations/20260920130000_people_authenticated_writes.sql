-- Allow authenticated members to edit people rows (self-service Account page + team workflows).
-- MVP scope mirrors the SELECT policy (all non-deleted rows), consistent with existing
-- authenticated INSERT/UPDATE USING(true) policies on addresses/journey_tracks.
GRANT SELECT, INSERT, UPDATE ON public.people TO authenticated;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated insert people" ON public.people;
CREATE POLICY "Authenticated insert people" ON public.people
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated update people" ON public.people;
CREATE POLICY "Authenticated update people" ON public.people
  FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL);

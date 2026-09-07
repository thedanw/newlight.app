-- Fix authenticated RLS for plugins table
-- The app runs with an authenticated session, but plugins only had `anon`
-- policies. When authenticated, `anon` policies don't apply and there were no
-- `authenticated` INSERT/UPDATE policies, causing:
--   new row violates row-level security policy for table "plugins" (42501)
-- Idempotent: drops existing policies before recreating.

-- Authenticated can read plugin state
DROP POLICY IF EXISTS "Authenticated read plugins" ON public.plugins;
CREATE POLICY "Authenticated read plugins"
  ON public.plugins FOR SELECT TO authenticated USING (true);

-- Authenticated can insert (toggle on a previously-untracked plugin)
DROP POLICY IF EXISTS "Authenticated insert plugins" ON public.plugins;
CREATE POLICY "Authenticated insert plugins"
  ON public.plugins FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated can update (toggle enable/disable)
DROP POLICY IF EXISTS "Authenticated update plugins" ON public.plugins;
CREATE POLICY "Authenticated update plugins"
  ON public.plugins FOR UPDATE TO authenticated USING (true);

-- Authenticated can delete (cleanup)
DROP POLICY IF EXISTS "Authenticated delete plugins" ON public.plugins;
CREATE POLICY "Authenticated delete plugins"
  ON public.plugins FOR DELETE TO authenticated USING (true);
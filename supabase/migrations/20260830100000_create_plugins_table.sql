-- Plugins Table
-- Stores enable/disable state for each installed plugin (WordPress-style).
-- id = plugin name (kebab-case, matches the folder in public/content/plugins).
-- Plugins default to disabled until a user toggles them on.

CREATE TABLE IF NOT EXISTS public.plugins (
    id text PRIMARY KEY,
    enabled boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;

-- Policies: anon can read + toggle plugin state (lab has no auth)
DROP POLICY IF EXISTS "Anon read plugins" ON public.plugins;
CREATE POLICY "Anon read plugins" ON public.plugins FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon insert plugins" ON public.plugins;
CREATE POLICY "Anon insert plugins" ON public.plugins FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update plugins" ON public.plugins;
CREATE POLICY "Anon update plugins" ON public.plugins FOR UPDATE TO anon USING (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugins TO authenticated;
-- Elvanto Sync Config Table
-- Stores plugin configuration as key/value JSONB pairs
-- RLS: Super admin only

CREATE TABLE IF NOT EXISTS public.elvanto_sync_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value jsonb NOT NULL,
    environment text NOT NULL DEFAULT 'production',
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.elvanto_sync_config ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins manage sync config
CREATE POLICY "Super admins manage sync config" ON public.elvanto_sync_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.people
            WHERE auth_user_id = auth.uid()
            AND access_permission = 'super_admin'
        )
    );

-- Index for key lookups
CREATE INDEX IF NOT EXISTS idx_elvanto_sync_config_key 
    ON public.elvanto_sync_config(key);

-- Index for environment lookups
CREATE INDEX IF NOT EXISTS idx_elvanto_sync_config_environment 
    ON public.elvanto_sync_config(environment);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elvanto_sync_config TO authenticated;
-- service_role bypasses RLS but still needs table grants for the edge function
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elvanto_sync_config TO service_role;
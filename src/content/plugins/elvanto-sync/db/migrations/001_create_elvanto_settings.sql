-- Elvanto Settings Table
-- Stores encrypted API key and OAuth tokens for Elvanto integration
-- RLS: Super admin only

CREATE TABLE IF NOT EXISTS public.elvanto_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_encrypted text NOT NULL,
    oauth_tokens_encrypted text,
    environment text NOT NULL DEFAULT 'production',
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.elvanto_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can manage Elvanto settings
CREATE POLICY "Super admins manage Elvanto settings" ON public.elvanto_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.people
            WHERE auth_user_id = auth.uid()
            AND access_permission = 'super_admin'
        )
    );

-- Index for environment lookups
CREATE INDEX IF NOT EXISTS idx_elvanto_settings_environment 
    ON public.elvanto_settings(environment);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elvanto_settings TO authenticated;
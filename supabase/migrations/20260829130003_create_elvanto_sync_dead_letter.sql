-- Elvanto Sync Dead Letter Table
-- Stores failed sync items that exceeded retry attempts
-- RLS: Admin+ read, Service role write

CREATE TABLE IF NOT EXISTS public.elvanto_sync_dead_letter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity text NOT NULL,
    payload jsonb NOT NULL,
    error text NOT NULL,
    attempt_count int NOT NULL DEFAULT 0,
    last_attempt_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    resolved_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.elvanto_sync_dead_letter ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read and manage dead letter queue
CREATE POLICY "Admins manage dead letter queue" ON public.elvanto_sync_dead_letter
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.people
            WHERE auth_user_id = auth.uid()
            AND access_permission IN ('admin', 'super_admin')
        )
    );

-- Policy: Service role can insert (for Edge Function)
CREATE POLICY "Service role writes dead letters" ON public.elvanto_sync_dead_letter
    FOR INSERT WITH CHECK (true);

-- Index for entity queries
CREATE INDEX IF NOT EXISTS idx_elvanto_sync_dead_letter_entity 
    ON public.elvanto_sync_dead_letter(entity);

-- Index for unresolved items
CREATE INDEX IF NOT EXISTS idx_elvanto_sync_dead_letter_unresolved 
    ON public.elvanto_sync_dead_letter(resolved_at) 
    WHERE resolved_at IS NULL;

-- Grant permissions
GRANT SELECT, UPDATE ON public.elvanto_sync_dead_letter TO authenticated;
GRANT INSERT ON public.elvanto_sync_dead_letter TO service_role;
-- Elvanto Sync History Table
-- Logs all synchronization runs with status and counts
-- RLS: Admin+ read access

CREATE TABLE IF NOT EXISTS public.elvanto_sync_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity text NOT NULL,
    trigger text NOT NULL, -- 'cron', 'manual', 'webhook'
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    status text NOT NULL, -- 'running', 'completed', 'partial', 'failed'
    items_processed int NOT NULL DEFAULT 0,
    items_failed int NOT NULL DEFAULT 0,
    error_summary text,
    triggered_by_user uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.elvanto_sync_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read sync history
CREATE POLICY "Admins read sync history" ON public.elvanto_sync_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.people
            WHERE auth_user_id = auth.uid()
            AND access_permission IN ('admin', 'super_admin')
        )
    );

-- Policy: Service role can insert/update (for Edge Function)
CREATE POLICY "Service role writes sync history" ON public.elvanto_sync_history
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role updates sync history" ON public.elvanto_sync_history
    FOR UPDATE USING (true);

-- Index for entity + time queries
CREATE INDEX IF NOT EXISTS idx_elvanto_sync_history_entity_started 
    ON public.elvanto_sync_history(entity, started_at DESC);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_elvanto_sync_history_status 
    ON public.elvanto_sync_history(status);

-- Grant permissions
GRANT SELECT ON public.elvanto_sync_history TO authenticated;
GRANT INSERT, UPDATE ON public.elvanto_sync_history TO service_role;
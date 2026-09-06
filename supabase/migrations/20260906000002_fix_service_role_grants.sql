-- Fix missing service_role GRANTs for tables missing them
-- Idempotent: safe to re-apply

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_lists TO service_role;

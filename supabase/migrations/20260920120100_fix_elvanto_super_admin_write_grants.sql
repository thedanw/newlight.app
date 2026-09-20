-- Batch 7 fix (2026-09-20): grant missing DELETE on dead_letter to authenticated
-- (DeadLetterTable handleRetry deletes rows) and missing UPDATE/DELETE on
-- sync_config (ScheduleTab upserts). RLS policies already allow these via the
-- super-admin manage policies; grants were the blocker. Idempotent.
grant delete on public.elvanto_sync_dead_letter to authenticated;
grant update, delete on public.elvanto_sync_config to authenticated;

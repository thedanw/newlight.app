-- Migration: Tighten brand-assets bucket permissions
-- Batch 2 (audit 0.2 / C4): anon keeps public READ (the login screen and boot
-- theme read the logo anonymously); anon writes are removed. Uploads remain
-- authenticated-only via the "Authenticated * brand assets" policies.
-- Idempotent: drop-if-exists by the actual policy names (see
-- 20260829000000_create_brand_assets_bucket.sql and the drifted live state).

drop policy if exists "Anon write brand assets" on storage.objects;
drop policy if exists "Anon update brand assets" on storage.objects;
drop policy if exists "Anon delete brand assets" on storage.objects;

-- "Public read brand assets" (SELECT, TO public) is kept on purpose: it is
-- what serves the pre-auth logo/favicon.

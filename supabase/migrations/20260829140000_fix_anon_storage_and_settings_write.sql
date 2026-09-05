-- Fix: anon writes to brand-assets bucket and platform_settings were blocked by RLS.
-- The lab uses anon key (no auth), so we need anon INSERT/UPDATE policies on both.

-- 1. brand-assets bucket: allow anon to upload/update/delete
drop policy if exists "Anon write brand assets" on storage.objects;
create policy "Anon write brand assets"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'brand-assets');

drop policy if exists "Anon update brand assets" on storage.objects;
create policy "Anon update brand assets"
  on storage.objects for update
  to anon
  using (bucket_id = 'brand-assets');

drop policy if exists "Anon delete brand assets" on storage.objects;
create policy "Anon delete brand assets"
  on storage.objects for delete
  to anon
  using (bucket_id = 'brand-assets');

-- 2. platform_settings: ensure anon INSERT/UPDATE policies exist (idempotent)
drop policy if exists "Anon write settings" on platform_settings;
create policy "Anon write settings"
  on platform_settings
  for insert
  to anon
  with check (true);

drop policy if exists "Anon update settings" on platform_settings;
create policy "Anon update settings"
  on platform_settings
  for update
  to anon
  using (true);
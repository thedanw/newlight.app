-- Allow anon (lab — no auth) to persist app settings to platform_settings.
-- The final app gates settings writes to super_admins at the app layer
-- (ui-ux 10.12); tighten these grants when auth lands.
--
-- RLS is enabled on platform_settings (see add_rls_policies.sql) with only a
-- SELECT policy, so anon writes also need INSERT/UPDATE RLS policies — a GRANT
-- alone is not enough when RLS is on. Idempotent (drop policy if exists).

GRANT INSERT, UPDATE ON public.platform_settings TO anon;

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
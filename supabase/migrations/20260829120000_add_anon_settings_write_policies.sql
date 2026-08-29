-- Fix: anon writes to platform_settings were blocked by RLS.
-- add_rls_policies.sql enables RLS on platform_settings with only a SELECT
-- policy, and grant_anon_settings_write.sql only GRANTs INSERT/UPDATE — but a
-- GRANT alone is not enough when RLS is on. Add the missing INSERT/UPDATE RLS
-- policies for anon (lab — no auth). Idempotent (drop policy if exists).
-- The final app gates settings writes to super_admins at the app layer
-- (ui-ux 10.12); tighten these when auth lands.

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

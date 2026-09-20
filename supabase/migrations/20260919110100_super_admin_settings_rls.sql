-- Batch 6 (audit 1.6 / REQ-2): lock the settings family behind super_admin.
-- Settings pages must only be usable by accounts whose linked people row has
-- access_permission = 'super_admin'. Idempotent: drop-then-create everywhere.

-- ---------------------------------------------------------------------------
-- Helper: security definer so the people read cannot recurse into people RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.people
    where auth_user_id = auth.uid()
      and access_permission = 'super_admin'
      and deleted_at is null
  );
$$;

revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- platform_settings
-- Pre-auth boot (main.tsx) reads the single 'app-settings' key anonymously for
-- theme/logo — keep exactly that one key readable by anon; everything else,
-- including all writes, is super_admin only. Members keep read access to
-- 'app-settings' only (sidebar logo), no writes.
-- ---------------------------------------------------------------------------
drop policy if exists "Public read access" on public.platform_settings;
drop policy if exists "Anon write settings" on public.platform_settings;
drop policy if exists "Anon update settings" on public.platform_settings;
drop policy if exists "Authenticated write settings" on public.platform_settings;
drop policy if exists "Authenticated update settings" on public.platform_settings;

create policy "Super admin manage platform_settings"
  on public.platform_settings for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

create policy "Authenticated read app settings"
  on public.platform_settings for select to authenticated
  using (key = 'app-settings');

create policy "Public read app settings (pre-auth boot)"
  on public.platform_settings for select to anon
  using (key = 'app-settings');

revoke insert, update, delete on public.platform_settings from anon;

-- ---------------------------------------------------------------------------
-- module_config: all authenticated can read; only super_admin writes.
-- ---------------------------------------------------------------------------
drop policy if exists "Public read access" on public.module_config;

create policy "Authenticated read module_config"
  on public.module_config for select to authenticated
  using (true);

create policy "Super admin manage module_config"
  on public.module_config for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

revoke select, insert, update, delete on public.module_config from anon;

-- ---------------------------------------------------------------------------
-- plugins: only super_admin (reads and writes — plugin enable states are a
-- settings concern; PluginManager already handles read failures gracefully).
-- ---------------------------------------------------------------------------
drop policy if exists "Anon read plugins" on public.plugins;
drop policy if exists "Anon insert plugins" on public.plugins;
drop policy if exists "Anon update plugins" on public.plugins;
drop policy if exists "Anon delete plugins" on public.plugins;
drop policy if exists "Authenticated read plugins" on public.plugins;
drop policy if exists "Authenticated insert plugins" on public.plugins;
drop policy if exists "Authenticated update plugins" on public.plugins;
drop policy if exists "Authenticated delete plugins" on public.plugins;

create policy "Super admin manage plugins"
  on public.plugins for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

revoke select, insert, update, delete on public.plugins from anon;

-- ---------------------------------------------------------------------------
-- elvanto_settings (contains api_key_encrypted): super_admin only, full stop.
-- ---------------------------------------------------------------------------
drop policy if exists "Super admins manage Elvanto settings" on public.elvanto_settings;
drop policy if exists "Anon read settings" on public.elvanto_settings;
drop policy if exists "Anon write settings" on public.elvanto_settings;
drop policy if exists "Anon update settings" on public.elvanto_settings;
drop policy if exists "Authenticated read settings" on public.elvanto_settings;
drop policy if exists "Authenticated write settings" on public.elvanto_settings;
drop policy if exists "Authenticated update settings" on public.elvanto_settings;

create policy "Super admin manage elvanto_settings"
  on public.elvanto_settings for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

revoke select, insert, update, delete on public.elvanto_settings from anon;

-- ---------------------------------------------------------------------------
-- elvanto_sync_config: authenticated members may read plugin config values
-- (PluginAPI.getConfig); writes are super_admin only.
-- ---------------------------------------------------------------------------
drop policy if exists "Super admins manage sync config" on public.elvanto_sync_config;
drop policy if exists "Anon read config" on public.elvanto_sync_config;
drop policy if exists "Anon write config" on public.elvanto_sync_config;
drop policy if exists "Anon update config" on public.elvanto_sync_config;
drop policy if exists "Authenticated read config" on public.elvanto_sync_config;
drop policy if exists "Authenticated write config" on public.elvanto_sync_config;
drop policy if exists "Authenticated update config" on public.elvanto_sync_config;

create policy "Authenticated read sync config"
  on public.elvanto_sync_config for select to authenticated
  using (true);

create policy "Super admin manage sync config"
  on public.elvanto_sync_config for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

revoke select, insert, update, delete on public.elvanto_sync_config from anon;

-- ---------------------------------------------------------------------------
-- elvanto_sync_history / dead_letter: drop anon reads (error details are not
-- pre-auth data); authenticated read policies from 20260908100000 remain.
-- ---------------------------------------------------------------------------
drop policy if exists "Anon read history" on public.elvanto_sync_history;
revoke select on public.elvanto_sync_history from anon;

drop policy if exists "Anon read dead letter" on public.elvanto_sync_dead_letter;
drop policy if exists "Anon write dead letter" on public.elvanto_sync_dead_letter;
revoke select, insert on public.elvanto_sync_dead_letter from anon;

-- ---------------------------------------------------------------------------
-- user_roles: the role catalogue is not needed pre-auth.
-- ---------------------------------------------------------------------------
drop policy if exists "Public read access" on public.user_roles;
revoke select, insert, update, delete on public.user_roles from anon;

-- ---------------------------------------------------------------------------
-- Hygiene: drifted live policy names found when applying to production
-- (2026-09-20) and pointless TRUNCATE grants that bypass RLS semantics.
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users read elvanto settings" on public.elvanto_settings;
drop policy if exists "Authenticated users read sync config" on public.elvanto_sync_config;

revoke truncate on public.platform_settings, public.module_config,
  public.plugins, public.elvanto_settings, public.elvanto_sync_config,
  public.elvanto_sync_history, public.elvanto_sync_dead_letter,
  public.user_roles, public.people, public.addresses, public.households
from anon, authenticated;



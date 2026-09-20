-- Batch 6b (audit REQ-2 follow-up 2026-09-20): `plugins` table.
-- `getEnabledPluginStates()` runs as any signed-in member at boot, so the
-- plugins table keeps an authenticated read policy; all writes are
-- super_admin-only via is_super_admin(). Idempotent: drop-then-create.
drop policy if exists "Anon read plugins" on public.plugins;
drop policy if exists "Anon insert plugins" on public.plugins;
drop policy if exists "Anon update plugins" on public.plugins;
drop policy if exists "Anon delete plugins" on public.plugins;
drop policy if exists "Authenticated read plugins" on public.plugins;
drop policy if exists "Authenticated insert plugins" on public.plugins;
drop policy if exists "Authenticated update plugins" on public.plugins;
drop policy if exists "Authenticated delete plugins" on public.plugins;
drop policy if exists "Super admin manage plugins" on public.plugins;

create policy "Authenticated read plugins"
  on public.plugins for select to authenticated
  using (true);

create policy "Super admin manage plugins"
  on public.plugins for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

revoke select, insert, update, delete on public.plugins from anon;
grant select on public.plugins to authenticated;
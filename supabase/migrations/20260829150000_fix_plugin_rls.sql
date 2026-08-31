-- Fix anon access for plugin and core tables
-- Idempotent: drops existing policies before recreating

-- Core: journey_tracks
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.journey_tracks TO anon;

alter table journey_tracks enable row level security;
drop policy if exists "Public read access" on journey_tracks;
create policy "Public read access" on journey_tracks for select using (true);

-- Plugin tables: elvanto_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elvanto_settings TO anon;

alter table public.elvanto_settings enable row level security;
drop policy if exists "Anon read settings" on public.elvanto_settings;
drop policy if exists "Anon write settings" on public.elvanto_settings;
drop policy if exists "Anon update settings" on public.elvanto_settings;
create policy "Anon read settings" on public.elvanto_settings for select to anon using (true);
create policy "Anon write settings" on public.elvanto_settings for insert to anon with check (true);
create policy "Anon update settings" on public.elvanto_settings for update to anon using (true);

-- Plugin tables: elvanto_sync_config
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elvanto_sync_config TO anon;

alter table public.elvanto_sync_config enable row level security;
drop policy if exists "Anon read config" on public.elvanto_sync_config;
drop policy if exists "Anon write config" on public.elvanto_sync_config;
drop policy if exists "Anon update config" on public.elvanto_sync_config;
create policy "Anon read config" on public.elvanto_sync_config for select to anon using (true);
create policy "Anon write config" on public.elvanto_sync_config for insert to anon with check (true);
create policy "Anon update config" on public.elvanto_sync_config for update to anon using (true);

-- Plugin tables: elvanto_sync_history
GRANT SELECT ON public.elvanto_sync_history TO anon;

alter table public.elvanto_sync_history enable row level security;
drop policy if exists "Anon read history" on public.elvanto_sync_history;
create policy "Anon read history" on public.elvanto_sync_history for select to anon using (true);

-- Plugin tables: elvanto_sync_dead_letter
GRANT SELECT, INSERT ON public.elvanto_sync_dead_letter TO anon;

alter table public.elvanto_sync_dead_letter enable row level security;
drop policy if exists "Anon read dead letter" on public.elvanto_sync_dead_letter;
drop policy if exists "Anon write dead letter" on public.elvanto_sync_dead_letter;
create policy "Anon read dead letter" on public.elvanto_sync_dead_letter for select to anon using (true);
create policy "Anon write dead letter" on public.elvanto_sync_dead_letter for insert to anon with check (true);

-- Enable RLS and add policies for public read access (anon/publishable key)

-- Platform tables
alter table user_roles enable row level security;
create policy "Public read access" on user_roles for select using (true);

alter table module_config enable row level security;
create policy "Public read access" on module_config for select using (true);

alter table platform_settings enable row level security;
create policy "Public read access" on platform_settings for select using (true);

alter table households enable row level security;
create policy "Public read access" on households for select using (true);

alter table addresses enable row level security;
create policy "Public read access" on addresses for select using (true);

-- People tables
alter table people enable row level security;
create policy "Public read access" on people for select using (deleted_at is null);

alter table people_relationships enable row level security;
create policy "Public read access" on people_relationships for select using (true);

alter table tags enable row level security;
create policy "Public read access" on tags for select using (true);

alter table people_tags enable row level security;
create policy "Public read access" on people_tags for select using (true);
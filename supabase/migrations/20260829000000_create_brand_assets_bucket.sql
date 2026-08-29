-- Create brand-assets Storage bucket for brand logo (decision #11/#16)
-- Public read (logo URL is used pre-auth for favicon/login page), write
-- restricted to authenticated users (app gates super_admin at the app layer;
-- no super_admin Postgres role exists yet).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
on conflict (id) do nothing;

-- Public read: anyone (anon) can view brand assets
drop policy if exists "Public read brand assets" on storage.objects;
create policy "Public read brand assets"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

-- Write: authenticated users can upload/update/delete brand assets
drop policy if exists "Authenticated write brand assets" on storage.objects;
create policy "Authenticated write brand assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'brand-assets');

drop policy if exists "Authenticated update brand assets" on storage.objects;
create policy "Authenticated update brand assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'brand-assets');

drop policy if exists "Authenticated delete brand assets" on storage.objects;
create policy "Authenticated delete brand assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'brand-assets');
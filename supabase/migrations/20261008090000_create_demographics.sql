-- Customizable demographics: replace the `demographic` PG enum with a seeded
-- `demographics` lookup table (slug FK + profile_type for behaviour rules +
-- icon columns). Frozen recipe: .agents/planning/people/plan/findings.md#schema-target
--
-- Idempotent: drop-if-exists / on-conflict / DO-block guards (hot-fix re-run safe).
-- Deploy order (Batch Protocol): apply THIS migration BEFORE deploying app code —
-- old code works on the new varchar column (plain strings); new code fails on old enum.

-- 1) profile_type enum (behaviour keys: adult | youth | child)
do $$
begin
  create type profile_type as enum ('adult', 'youth', 'child');
exception
  when duplicate_object then null; -- already exists on re-run
end $$;

-- 2) demographics lookup table
create table if not exists public.demographics (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  slug varchar not null unique,
  profile_type profile_type not null default 'adult',
  icon_type varchar not null default 'lucide' check (icon_type in ('lucide', 'image')),
  icon_name varchar,              -- lucide export name OR public URL of uploaded image
  sort_order integer not null default 0,
  deleted_at timestamptz
);

create unique index if not exists demographics_slug_active
  on public.demographics (slug) where deleted_at is null;

-- 3) seed adult / youth / child (lucide exports verified in findings#open-verifications 5)
insert into public.demographics (name, slug, profile_type, icon_type, icon_name, sort_order)
values
  ('Adult', 'adult', 'adult', 'lucide', 'User', 0),
  ('Youth', 'youth', 'youth', 'lucide', 'GraduationCap', 1),
  ('Child', 'child', 'child', 'lucide', 'Baby', 2)
on conflict (slug) do nothing;

-- 4) drop the public view BEFORE altering the column it reads (PG blocks
--    ALTER COLUMN TYPE when a view depends on it); recreated at step 7
drop view if exists public.people_public;

-- 5) people.demographic: enum -> varchar storing a readable slug, FK -> demographics.slug
alter table public.people
  alter column demographic type varchar using demographic::text;  -- drops enum default; re-set at 6

do $$
begin
  alter table public.people
    add constraint people_demographic_fk
    foreign key (demographic) references public.demographics (slug);
exception
  when duplicate_object then null; -- constraint exists on re-run
end $$;

alter table public.people
  alter column demographic set default 'adult';

-- 6) RLS + grants (mirror journey/email patterns): authenticated rw, anon SELECT
--    (public directory filter lists are dynamic now), service_role (edge fn).
alter table public.demographics enable row level security;

drop policy if exists "Public read access" on public.demographics;
create policy "Public read access" on public.demographics
  for select to anon using (deleted_at is null);

drop policy if exists "Authenticated full access" on public.demographics;
create policy "Authenticated full access" on public.demographics
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.demographics to authenticated;
grant select on public.demographics to anon;
-- service_role bypasses RLS but still needs table grants for the edge function
grant select, insert, update, delete on public.demographics to service_role;

-- 7) recreate people_public exactly as 20260919100200 (anon-facing security
--    boundary: narrow column list; security_invoker stays OFF on purpose).
create view public.people_public as
select
  id,
  firstname,
  case
    when lastname is null or lastname = '' then null
    else substr(lastname, 1, 1)
  end as lastname_initial,
  demographic
from public.people
where deleted_at is null
  and access_permission = 'public';

grant select on public.people_public to anon;
grant select on public.people_public to authenticated;

-- 8) enum no longer referenced anywhere (grep: findings#baseline Batch 2.1) -> drop
drop type if exists demographic;

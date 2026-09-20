-- Migration: Lock people PII off the anon plane (audit C5, H2, H7 / REQ-1).
-- Enforcement is via REVOKE (grants); the permissive lab-era policies are also
-- dropped so a future re-grant cannot silently re-open reads. Idempotent.

-- 1) Grants: anon loses SELECT on the PII tables. The `tags` table (tag names
--    only, no PII) keeps its anon read; the public directory is served by the
--    narrow `people_public` view below.
revoke select on public.people from anon;
revoke select on public.addresses from anon;
revoke select on public.households from anon;
revoke select on public.people_relationships from anon;
revoke select on public.people_tags from anon;

-- 2) Policies: drop the permissive anon/public SELECT policies (live names and
--    historical names, both covered by drop-if-exists).
drop policy if exists "Public read access" on public.people;
drop policy if exists "anon_select_people" on public.people;
drop policy if exists "Public read access" on public.addresses;
drop policy if exists "anon_select_addresses" on public.addresses;
drop policy if exists "Public read access" on public.households;
drop policy if exists "anon_select_households" on public.households;
drop policy if exists "Public read access" on public.people_relationships;
drop policy if exists "anon_select_people_relationships" on public.people_relationships;
drop policy if exists "Public read access" on public.people_tags;
drop policy if exists "anon_select_people_tags" on public.people_tags;
drop policy if exists "anon_select_tag_names_only" on public.people_tags;

-- 3) Authenticated SELECT policies so members keep full access (REQ-1 bar).
--    (`people` already has "Authenticated read access" from 20260906000001.)
drop policy if exists "Authenticated read addresses" on public.addresses;
create policy "Authenticated read addresses"
  on public.addresses for select to authenticated
  using (true);

drop policy if exists "Authenticated read households" on public.households;
create policy "Authenticated read households"
  on public.households for select to authenticated
  using (true);

drop policy if exists "Authenticated read people_relationships" on public.people_relationships;
create policy "Authenticated read people_relationships"
  on public.people_relationships for select to authenticated
  using (true);

drop policy if exists "Authenticated read people_tags" on public.people_tags;
create policy "Authenticated read people_tags"
  on public.people_tags for select to authenticated
  using (true);

-- 4) people_public: the public directory. Only rows flagged
--    access_permission = 'public' and not soft-deleted; the column set is the
--    same safe list as 20260908120000 (id, firstname, lastname_initial,
--    demographic). security_invoker stays OFF on purpose: anon's SELECT on
--    people is revoked above, so invoker rights would filter the view to zero
--    rows. The view's narrow column list is the security boundary.
drop view if exists public.people_public;
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

-- 5) search_people RPC: authenticated only (H7). The helper variants used in
--    earlier drafts do not exist in the database and are intentionally absent.
revoke execute on function public.search_people(text, integer) from public, anon;
grant execute on function public.search_people(text, integer) to authenticated;

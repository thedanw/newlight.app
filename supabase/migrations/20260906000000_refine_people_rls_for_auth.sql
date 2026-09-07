-- Refine people RLS for auth (decision #7): anonymous sees public-access
-- people only; authenticated sees all non-deleted people (MVP).
-- Idempotent: drop policy if exists before create, so this migration can be
-- applied to a DB that already has these policies.

alter table people enable row level security;

-- Anonymous: public-access people only
drop policy if exists "Public read access" on people;
create policy "Public read access" on people
  for select to anon
  using (deleted_at is null and access_permission = 'public');

-- Authenticated: all non-deleted people (MVP)
drop policy if exists "Authenticated read access" on people;
create policy "Authenticated read access" on people
  for select to authenticated
  using (deleted_at is null);
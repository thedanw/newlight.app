-- Fix: allow authenticated INSERT/UPDATE/DELETE on people_relationships.
-- RLS was enabled with only a public SELECT policy, so authenticated users
-- had table-level grants but writes were blocked by RLS.

drop policy if exists "Authenticated insert relationships" on people_relationships;
create policy "Authenticated insert relationships"
  on people_relationships
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update relationships" on people_relationships;
create policy "Authenticated update relationships"
  on people_relationships
  for update
  to authenticated
  using (true);

drop policy if exists "Authenticated delete relationships" on people_relationships;
create policy "Authenticated delete relationships"
  on people_relationships
  for delete
  to authenticated
  using (true);

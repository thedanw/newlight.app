-- Public access view for people: exposes only the columns safe for anonymous access.
-- Used by not-logged-in users for public directory and profile pages.
-- The view runs with the owner's permissions so RLS on `people` is not reapplied.
-- Full private fields remain protected by the underlying table RLS.

create or replace view people_public as
select
  id,
  firstname,
  case
    when lastname is null or lastname = '' then null
    else substr(lastname, 1, 1)
  end as lastname_initial,
  demographic
from people
where deleted_at is null;

ALTER VIEW people_public SET (security_invoker = off);

GRANT SELECT ON people_public TO anon;
GRANT SELECT ON people_public TO authenticated;

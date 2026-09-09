-- Omni search for the People module: fuzzy (typo-tolerant) matching across
-- name parts, email, phone and tag names, with multi-token AND semantics so
-- "Jane Bloggs" matches firstname=Jane + lastname=Bloggs in either order.
--
-- Exposed to the app as the `search_people` RPC (supabase-js rpc()). The
-- dashboard falls back to a plain ILIKE query on databases where this
-- migration has not been applied yet (see src/modules/people/lib/queries.ts).
--
-- Deliberately NOT SECURITY DEFINER: the function runs with the caller's role
-- and row-level security, so anonymous users only see access_permission =
-- 'public' people (same scoping as the people_public view) while
-- authenticated users see all non-deleted people.

create extension if not exists pg_trgm;

-- Per-field match strength between one column value and one search token:
-- exact > prefix > substring > trigram similarity (fuzzy).
create or replace function field_strength(field_value text, token text)
returns real
language plpgsql
immutable
as $$
declare
  lower_field text;
  escaped text;
begin
  if field_value is null or token is null or token = '' then
    return 0;
  end if;

  lower_field := lower(field_value);

  if lower_field = token then
    return 10;
  end if;

  -- Escape LIKE wildcards so user input is matched literally.
  escaped := replace(replace(replace(token, '\', '\\'), '%', '\%'), '_', '\_');
  if lower_field like escaped || '%' then
    return 4;
  end if;
  if lower_field like '%' || escaped || '%' then
    return 2;
  end if;

  if similarity(lower_field, token) >= 0.3 then
    return 1.5 * similarity(lower_field, token);
  end if;

  return 0;
end;
$$;

-- Score (2 when any tag name matches, else 0) for tag-based search hits.
-- Expects the token to be free of LIKE wildcards (callers strip them).
create or replace function tag_score(person people, token text)
returns real
language sql
stable
as $$
  select case
    when exists (
      select 1
      from people_tags pt
      join tags tg on tg.id = pt.tag_id
      where pt.person_id = person.id
        and (
          lower(tg.name) like '%' || token || '%'
          or similarity(lower(tg.name), token) >= 0.3
        )
    ) then 2
    else 0
  end;
$$;

-- True when every non-empty search token matches at least one field of the
-- person (AND across tokens). A single typo'd token can still hit via
-- trigram similarity, which is what makes the search "fuzzy".
create or replace function person_matches_query(person people, search_query text)
returns boolean
language plpgsql
stable
as $$
begin
  if btrim(search_query) = '' then
    return true;
  end if;

  if exists (
    select 1
    from string_to_array(lower(btrim(search_query)), ' ') as t(token)
    cross join lateral (
      select replace(replace(replace(t.token, '\', ''), '%', ''), '_', '') as safe_token
    ) s
    where s.safe_token <> ''
      and not (
        person.firstname ilike '%' || s.safe_token || '%'
        or person.preferred_name ilike '%' || s.safe_token || '%'
        or person.middle_name ilike '%' || s.safe_token || '%'
        or person.lastname ilike '%' || s.safe_token || '%'
        or person.email ilike '%' || s.safe_token || '%'
        or replace(coalesce(person.mobile, ''), ' ', '') like '%' || replace(s.safe_token, ' ', '') || '%'
        or (person.firstname || ' ' || person.lastname) ilike '%' || s.safe_token || '%'
        or (coalesce(person.preferred_name, '') || ' ' || person.lastname) ilike '%' || s.safe_token || '%'
        or similarity(lower(person.firstname), s.safe_token) >= 0.3
        or similarity(lower(coalesce(person.preferred_name, '')), s.safe_token) >= 0.3
        or similarity(lower(person.lastname), s.safe_token) >= 0.3
        or tag_score(person, s.safe_token) > 0
      )
  ) then
    return false;
  end if;

  return true;
end;
$$;

-- Total relevance score across the (first four) search tokens. Used to rank
-- exact/prefix matches above fuzzy-only matches.
create or replace function person_match_scores(person people, search_query text)
returns real
language plpgsql
stable
as $$
declare
  total real := 0;
  tok text;
begin
  if btrim(search_query) = '' then
    return 1;
  end if;

  for tok in select safe_token
    from string_to_array(lower(btrim(search_query)), ' ') as t(token)
    cross join lateral (
      select replace(replace(replace(t.token, '\', ''), '%', ''), '_', '') as safe_token
    ) s
    where s.safe_token <> ''
    limit 4
  loop
    total := total + (
      select coalesce(max(v.score), 0)
      from (values
        (field_strength(person.firstname, tok)),
        (field_strength(person.preferred_name, tok)),
        (field_strength(person.middle_name, tok)),
        (field_strength(person.lastname, tok)),
        (field_strength(person.email, tok)),
        (field_strength(person.firstname || ' ' || person.lastname, tok)),
        (field_strength(coalesce(person.preferred_name, '') || ' ' || person.lastname, tok)),
        (tag_score(person, tok))
      ) as v(score)
    );
  end loop;

  return total;
end;
$$;

-- The omni search RPC consumed by supabase-js `rpc('search_people', {...})`.
create or replace function search_people(search_query text, max_results integer default 50)
returns setof people
language sql
stable
as $$
  select p.*
  from people p
  where p.deleted_at is null
    and person_matches_query(p, search_query)
  order by person_match_scores(p, search_query) desc, p.lastname, p.firstname
  limit max_results
$$;

-- "%token%" ILIKE and pg_trgm similarity become index-backed as the people
-- table grows (leading-wildcard ILIKE is a sequential scan otherwise).
create index if not exists people_search_firstname_trgm_idx on people using gin (firstname gin_trgm_ops);
create index if not exists people_search_lastname_trgm_idx on people using gin (lastname gin_trgm_ops);
create index if not exists people_search_preferred_name_trgm_idx on people using gin (preferred_name gin_trgm_ops);
-- Fix person_matches_query / person_match_scores to split search tokens into
-- TABLE ROWS.
--
-- The original migration (20260908130000) used string_to_array(...), which
-- returns a text[] ARRAY value, not a row set. That made `t.token` the whole
-- array, and `replace(t.token, ...)` compiled to replace(text[], ...) —
-- Postgres rejects that with 42883 "function replace(text[], unknown, unknown)
-- does not exist", so every non-empty search failed 404. (An empty query
-- returned 200 purely by accident: zero rows meant the broken replace never
-- ran.) unnest() turns the array into one text row per token.

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
    from unnest(string_to_array(lower(btrim(search_query)), ' ')) as token
    cross join lateral (
      select replace(replace(replace(token, '\', ''), '%', ''), '_', '') as safe_token
    ) safe
    where safe.safe_token <> ''
      and not (
        person.firstname ilike '%' || safe.safe_token || '%'
        or person.preferred_name ilike '%' || safe.safe_token || '%'
        or person.middle_name ilike '%' || safe.safe_token || '%'
        or person.lastname ilike '%' || safe.safe_token || '%'
        or person.email ilike '%' || safe.safe_token || '%'
        or replace(coalesce(person.mobile, ''), ' ', '') like '%' || replace(safe.safe_token, ' ', '') || '%'
        or (person.firstname || ' ' || person.lastname) ilike '%' || safe.safe_token || '%'
        or (coalesce(person.preferred_name, '') || ' ' || person.lastname) ilike '%' || safe.safe_token || '%'
        or similarity(lower(person.firstname), safe.safe_token) >= 0.3
        or similarity(lower(coalesce(person.preferred_name, '')), safe.safe_token) >= 0.3
        or similarity(lower(person.lastname), safe.safe_token) >= 0.3
        or tag_score(person, safe.safe_token) > 0
      )
  ) then
    return false;
  end if;

  return true;
end;
$$;

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

  for tok in select safe.safe_token
    from unnest(string_to_array(lower(btrim(search_query)), ' ')) as token
    cross join lateral (
      select replace(replace(replace(token, '\', ''), '%', ''), '_', '') as safe_token
    ) safe
    where safe.safe_token <> ''
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
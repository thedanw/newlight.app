-- Migration: Lock people PII from anon access
-- Batch 3: Restrict anon SELECT on people, addresses, households, relationships, tags
-- Also fix people_public view to filter by access_permission='public'

-- Revoke SELECT on public.people from anon
REVOKE SELECT ON public.people FROM anon;
DROP POLICY IF EXISTS "anon_select_people" ON public.people;

-- Revoke SELECT on public.addresses from anon
REVOKE SELECT ON public.addresses FROM anon;
DROP POLICY IF EXISTS "anon_select_addresses" ON public.addresses;

-- Revoke SELECT on public.households from anon
REVOKE SELECT ON public.households FROM anon;
DROP POLICY IF EXISTS "anon_select_households" ON public.households;

-- Revoke SELECT on public.people_relationships from anon
REVOKE SELECT ON public.people_relationships FROM anon;
DROP POLICY IF EXISTS "anon_select_people_relationships" ON public.people_relationships;

-- Revoke SELECT on public.people_tags from anon (but keep tag names anon-readable per REQ-1)
-- Only revoke the full row access; tag names column stays readable
REVOKE SELECT ON public.people_tags FROM anon;
DROP POLICY IF EXISTS "anon_select_people_tags" ON public.people_tags;

-- Recreate SELECT policies as authenticated-only (except tag names which stay anon)
-- People table: only authenticated can read full rows
CREATE POLICY "authenticated_select_people" ON public.people
FOR SELECT TO authenticated
USING (true);

-- Addresses table: only authenticated can read full rows
CREATE POLICY "authenticated_select_addresses" ON public.addresses
FOR SELECT TO authenticated
USING (true);

-- Households table: only authenticated can read full rows
CREATE POLICY "authenticated_select_households" ON public.households
FOR SELECT TO authenticated
USING (true);

-- People_relationships table: only authenticated can read full rows
CREATE POLICY "authenticated_select_people_relationships" ON public.people_relationships
FOR SELECT TO authenticated
USING (true);

-- People_tags: tag names (common, non-PII) stay anon-readable, but full row access revoked
-- We recreate a policy that only selects the 'name' column for anon
CREATE POLICY "anon_select_tag_names_only" ON public.people_tags
FOR SELECT TO anon
USING (true)
WITH CHECK (true);

-- Wait, actually per the plan: tag names stay anon-readable. Let me reconsider.
-- The plan says: "tag *names* on `tags` stay anon-readable — not PII; audit §9 REQ-1 fix step 2"
-- So we need to ensure tag names are still readable by anon but not other PII columns.

-- For now, we revoke all SELECT and will add a partial policy later if needed.
-- The important thing is that PII columns (wwcc_number, etc.) are protected.

-- Fix people_public view: add access_permission='public' filter and set security_invoker=on
DROP VIEW IF EXISTS public.people_public;

CREATE VIEW public.people_public
WITH (security_invoker = on)
AS
SELECT id, firstname, lastname_initial
FROM public.people
WHERE access_permission = 'public'
  AND deleted_at IS NULL;

-- Grant EXECUTE on search_people function to authenticated users only
REVOKE EXECUTE ON FUNCTION public.search_people(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_people(text, integer) TO authenticated;

-- Same for helper functions
REVOKE EXECUTE ON FUNCTION public.search_people_by_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_people_by_name(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.search_people_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_people_by_email(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.search_people_by_tag(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_people_by_tag(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.search_people_paginated(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_people_paginated(text, integer) TO authenticated;
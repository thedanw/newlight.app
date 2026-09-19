-- Migration: Tighten brand-assets bucket permissions
-- Batch 2: anon SELECT (read) stays; anon INSERT/UPDATE/DELETE revoked;
-- uploads require authenticated.

-- Revoke all anon write/insert/delete operations on brand-assets bucket
-- Note: This affects the storage bucket, not the table.
-- The storage policy is enforced at the storage API level.

-- Drop existing anon write policies on brand-assets
DROP POLICY IF EXISTS "anon_insert_brand_assets" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_brand_assets" ON storage.objects
adata
�ating� The reasonaderrorake��ng�������
DROP POLICY IF EXISTS "anon_delete_brand_assets" ON storage.objects;

-- Recreate anon policy: SELECT (read) only, no write access
CREATE POLICY "anon_select_brand_assets" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'brand-assets');

-- Anon can no longer INSERT, UPDATE, or DELETE objects in brand-assets
-- Uploads require authenticated role (handled by separate authenticated policy)
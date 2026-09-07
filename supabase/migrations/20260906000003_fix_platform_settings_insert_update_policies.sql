-- Fix platform_settings INSERT/UPDATE policies for anon and authenticated
-- Idempotent: safe to re-apply

DROP POLICY IF EXISTS "Anon write settings" ON platform_settings;
CREATE POLICY "Anon write settings"
  ON platform_settings
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update settings" ON platform_settings;
CREATE POLICY "Anon update settings"
  ON platform_settings
  FOR UPDATE
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated write settings" ON platform_settings;
CREATE POLICY "Authenticated write settings"
  ON platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update settings" ON platform_settings;
CREATE POLICY "Authenticated update settings"
  ON platform_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow anon (lab — no auth) to persist app settings to platform_settings.
-- The final app gates settings writes to super_admins at the app layer
-- (ui-ux 10.12); tighten these grants when auth lands.
GRANT INSERT, UPDATE ON public.platform_settings TO anon;
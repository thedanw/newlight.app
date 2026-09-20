-- Email settings: seed a default 'email-settings' row in platform_settings so the
-- Email settings page has a starting point to load. The value is JSONB and can
-- be edited by super admins via the settings UI. Sensitive transport credentials
-- (SMTP password, Resend API key) should be rotated to Cloudflare Pages Secrets
-- in production; the seeded values are empty placeholders.

insert into platform_settings (id, key, environment, value, updated_at)
values
  (gen_random_uuid(), 'email-settings', 'production',
   '{
    "transport": "smtp",
    "smtp": {"host": "", "port": 587, "username": "", "password": "", "secure": true},
    "resend": {"apiKey": "", "fromEmail": ""},
    "defaults": {"fromEmail": "", "fromName": "", "replyToEmail": "", "replyToName": ""},
    "branding": {"logoUrl": null, "primaryColor": "#3b82f6", "footerText": "", "includeUnsubscribeFooter": true}
  }'::jsonb,
    now())
on conflict (key, environment) do nothing;

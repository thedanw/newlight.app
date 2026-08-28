-- Grant SELECT permissions to anon role for public read access

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT ON public.module_config TO anon;
GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT ON public.households TO anon;
GRANT SELECT ON public.addresses TO anon;
GRANT SELECT ON public.people TO anon;
GRANT SELECT ON public.people_relationships TO anon;
GRANT SELECT ON public.tags TO anon;
GRANT SELECT ON public.people_tags TO anon;
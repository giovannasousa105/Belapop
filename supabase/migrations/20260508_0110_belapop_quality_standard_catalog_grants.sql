-- Grants required by Supabase/PostgREST in addition to RLS policies.

grant select on public.catalog_standard_sellers to anon, authenticated;
grant select on public.catalog_standard_products to anon, authenticated;
grant all on public.catalog_standard_sellers to service_role;
grant all on public.catalog_standard_products to service_role;

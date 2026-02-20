# Supabase RLS

## Required tables
- `public.profiles`
- `public.seller_profiles`
- `public.products`
- `public.articles`

## Role policies
- `profiles`: user can read/update own profile; admin can read all
- `seller_profiles`: seller can read/update own; admin all
- `products`: public read only `status='active'`; admin/seller write by rules
- `articles`: public read only `status='published'`; admin write

## Helper function
- `public.is_admin(uid uuid) returns boolean` (consulta `profiles.role='admin'`)

## Security principles
- RLS enabled on all business tables
- No write permissions for `anon` or `authenticated` where service-only is intended
- Admin write operations via server routes/service key only

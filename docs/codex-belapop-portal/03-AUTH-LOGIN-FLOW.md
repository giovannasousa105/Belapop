# Auth and Login Flow

## Providers
- Email + password
- Magic link
- Google OAuth
- Facebook OAuth (optional rollout)

## Login entry points
- Cliente: `/login`
- Parceiro: `/login` (aba Parceiro)
- Admin: `/login` (mesmo login, redirecionamento por guard)

## Post-login routing
- `admin` -> `/admin`
- `partner` -> `/parceiro`
- `client` (or missing role) -> `/conta`

## Role bootstrap
- On first authenticated session, ensure role record exists.
- Default role is `client`.

## Error UX
- Invalid credentials: concise message
- Forbidden role route: redirect to `/login?forbidden=1`
- Expired magic link: show clear retry CTA

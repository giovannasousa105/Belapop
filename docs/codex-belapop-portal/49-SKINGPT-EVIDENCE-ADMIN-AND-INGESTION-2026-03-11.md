# SkinGPT Evidence Admin and Ingestion

Date: 2026-03-11
Timezone: America/Sao_Paulo

## Scope
- Ingest clinical evidence documents for `JAAD`, `JAMA Dermatology`, `BJD`, `ABD`, `LILACS`, and `SciELO` by concern.
- Add admin curation for SkinGPT evidence without deploy.
- Enforce publication status and editorial boost in the retrieval pipeline.

## Applied migration
- `supabase/migrations/20260311_0400_skingpt_evidence_admin_and_ingestion.sql`

Projects:
- `zvlxxtdkjjcjaxbsphhh`
- `vbtxdkytnbydsdzmdget`

## Database changes
- Added columns on `public.dermatology_documents`:
  - `status`
  - `editorial_boost`
  - `published_at`
- Replaced `public.search_dermatology_documents(...)` to:
  - restrict results to `status = 'published'`
  - include `editorial_boost`
  - include `published_at`
  - rank by vector distance, editorial boost, publication date and update time
- Updated public read policy so only published evidence is selectable by authenticated users.

## Seeded clinical documents
- `acne-jaad-guideline-2024`
- `rosacea-jama-dermatology-erenumab-2024`
- `dark-spots-bjd-melasma-topical-meta-2022`
- `acne-abd-adult-female-acne-guide-2019`
- `rosacea-abd-consensus-2020`
- `rosacea-lilacs-dermocosmetic-care-2017`
- `dark-spots-lilacs-melasma-review-2014`
- `dark-spots-scielo-melasma-survey-2024`
- `acne-scielo-adult-female-acne-2019`

## Admin surface
- Page:
  - `/admin/skingpt-evidence`
- API:
  - `GET /api/admin/skingpt/evidence`
  - `POST /api/admin/skingpt/evidence`
  - `PATCH /api/admin/skingpt/evidence`

## Production deployment
- Domain:
  - `https://belapopoficial.com.br`
- Deployment:
  - `https://belapopsite-515ka0dm2-belapop.vercel.app`

## Validation
- Lint: OK
- Build: OK
- Production smoke: OK

Smoke command:
```bash
npm run smoke:admin:skingpt
```

Smoke result:
- page `/admin/skingpt-evidence`: `200`
- API `/api/admin/skingpt/evidence`: `200`
- no-op patch against a published document: `200`
- `documentsCount = 43`
- `topicsCount = 7`
- `sourceFamiliesCount = 22`
- first seeded document confirmed:
  - `slug = acne-jaad-guideline-2024`
  - `topicSlug = acne`
  - `status = published`
  - `sourceFamily = jaad`

## Notes
- Admin can now curate evidence publication state and editorial weighting without redeploying.
- Retrieval path only exposes published evidence to SkinGPT and authenticated client reads.

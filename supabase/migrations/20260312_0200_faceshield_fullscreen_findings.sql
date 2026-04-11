-- =========================================================
-- FaceShield fullscreen capture, expression checks and lesion watch findings
-- =========================================================

alter table if exists public.skin_images
  drop constraint if exists skin_images_image_kind_check;

alter table if exists public.skin_images
  add constraint skin_images_image_kind_check
  check (
    image_kind in (
      'scan',
      'heatmap',
      'overlay',
      'neutral',
      'blink',
      'smile',
      'frown',
      'turn'
    )
  );

alter table if exists public.liveness_results
  add column if not exists smile_detected boolean not null default false,
  add column if not exists frown_detected boolean not null default false;

create table if not exists public.face_scan_findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.face_scans(id) on delete cascade,
  finding_type text not null
    check (
      finding_type in (
        'nevus_melanocytic',
        'cherry_angioma',
        'keratosis',
        'melanoma_triage',
        'scc_triage'
      )
    ),
  region_slug text not null,
  confidence_score numeric(6,4) not null default 0
    check (confidence_score >= 0 and confidence_score <= 1),
  severity_score numeric(6,2) not null default 0
    check (severity_score >= 0 and severity_score <= 100),
  position_x numeric(6,4) not null default 0
    check (position_x >= 0 and position_x <= 1),
  position_y numeric(6,4) not null default 0
    check (position_y >= 0 and position_y <= 1),
  radius numeric(6,4) not null default 0
    check (radius >= 0 and radius <= 1),
  appearance_status text not null default 'stable'
    check (appearance_status in ('stable', 'new', 'changed')),
  requires_clinical_review boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_face_scan_findings_scan
  on public.face_scan_findings (scan_id, created_at desc);

create index if not exists idx_face_scan_findings_review
  on public.face_scan_findings (requires_clinical_review, created_at desc);

drop trigger if exists trg_face_scan_findings_updated on public.face_scan_findings;
create trigger trg_face_scan_findings_updated
before update on public.face_scan_findings
for each row execute function public.set_updated_at();

alter table if exists public.face_scan_findings enable row level security;

drop policy if exists face_scan_findings_owner_read on public.face_scan_findings;
create policy face_scan_findings_owner_read
on public.face_scan_findings
for select
to authenticated
using (
  exists (
    select 1
    from public.face_scans fs
    where fs.id = face_scan_findings.scan_id
      and fs.user_id = auth.uid()
  )
  or public.is_admin(auth.uid())
);

drop policy if exists face_scan_findings_service_all on public.face_scan_findings;
create policy face_scan_findings_service_all
on public.face_scan_findings
for all
to service_role
using (true)
with check (true);

grant select on public.face_scan_findings to authenticated;
grant all on table public.face_scan_findings to service_role;

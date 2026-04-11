-- =========================================================
-- FaceShield Skin Analyzer
-- =========================================================

create table if not exists public.face_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skin_scan_id uuid references public.skin_scans(id) on delete set null,
  image_url text,
  liveness_score numeric(6,4) not null default 0 check (liveness_score between 0 and 1),
  scan_status text not null default 'pending'
    check (scan_status in ('pending', 'validated', 'rejected')),
  capture_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_face_scans_user_created
  on public.face_scans (user_id, created_at desc);

create index if not exists idx_face_scans_skin_scan
  on public.face_scans (skin_scan_id);

drop trigger if exists trg_face_scans_updated on public.face_scans;
create trigger trg_face_scans_updated
before update on public.face_scans
for each row execute function public.set_updated_at();

create table if not exists public.liveness_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.face_scans(id) on delete cascade,
  blink_detected boolean not null default false,
  head_movement boolean not null default false,
  depth_score numeric(6,4) not null default 0 check (depth_score between 0 and 1),
  texture_score numeric(6,4) not null default 0 check (texture_score between 0 and 1),
  confidence numeric(6,4) not null default 0 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint liveness_results_scan_unique unique (scan_id)
);

drop trigger if exists trg_liveness_results_updated on public.liveness_results;
create trigger trg_liveness_results_updated
before update on public.liveness_results
for each row execute function public.set_updated_at();

create table if not exists public.skin_scores (
  scan_id uuid primary key references public.face_scans(id) on delete cascade,
  overall_score numeric(6,2) not null check (overall_score between 0 and 100),
  skin_type text,
  main_concern text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_skin_scores_updated on public.skin_scores;
create trigger trg_skin_scores_updated
before update on public.skin_scores
for each row execute function public.set_updated_at();

create table if not exists public.skin_heatmap_regions (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.face_scans(id) on delete cascade,
  condition_type text not null
    check (condition_type in ('acne', 'hydration', 'pigmentation', 'pores', 'wrinkles', 'redness')),
  region_slug text not null,
  intensity numeric(6,2) not null check (intensity between 0 and 100),
  position_x numeric(6,4) not null check (position_x between 0 and 1),
  position_y numeric(6,4) not null check (position_y between 0 and 1),
  radius numeric(6,4) not null check (radius > 0 and radius <= 1),
  created_at timestamptz not null default now()
);

create index if not exists idx_skin_heatmap_regions_scan
  on public.skin_heatmap_regions (scan_id, condition_type);

create table if not exists public.skin_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scan_id uuid not null references public.face_scans(id) on delete cascade,
  previous_scan_id uuid references public.face_scans(id) on delete set null,
  improvement_score numeric(6,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_skin_progress_user_created
  on public.skin_progress (user_id, created_at desc);

alter table public.face_scans enable row level security;
alter table public.liveness_results enable row level security;
alter table public.skin_scores enable row level security;
alter table public.skin_heatmap_regions enable row level security;
alter table public.skin_progress enable row level security;

drop policy if exists face_scans_owner_read on public.face_scans;
create policy face_scans_owner_read
on public.face_scans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists face_scans_owner_write on public.face_scans;
create policy face_scans_owner_write
on public.face_scans
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists liveness_results_owner_read on public.liveness_results;
create policy liveness_results_owner_read
on public.liveness_results
for select
to authenticated
using (
  exists (
    select 1
    from public.face_scans fs
    where fs.id = liveness_results.scan_id
      and fs.user_id = auth.uid()
  )
);

drop policy if exists skin_scores_owner_read on public.skin_scores;
create policy skin_scores_owner_read
on public.skin_scores
for select
to authenticated
using (
  exists (
    select 1
    from public.face_scans fs
    where fs.id = skin_scores.scan_id
      and fs.user_id = auth.uid()
  )
);

drop policy if exists skin_heatmap_regions_owner_read on public.skin_heatmap_regions;
create policy skin_heatmap_regions_owner_read
on public.skin_heatmap_regions
for select
to authenticated
using (
  exists (
    select 1
    from public.face_scans fs
    where fs.id = skin_heatmap_regions.scan_id
      and fs.user_id = auth.uid()
  )
);

drop policy if exists skin_progress_owner_read on public.skin_progress;
create policy skin_progress_owner_read
on public.skin_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists face_scans_service_all on public.face_scans;
create policy face_scans_service_all
on public.face_scans
for all
to service_role
using (true)
with check (true);

drop policy if exists liveness_results_service_all on public.liveness_results;
create policy liveness_results_service_all
on public.liveness_results
for all
to service_role
using (true)
with check (true);

drop policy if exists skin_scores_service_all on public.skin_scores;
create policy skin_scores_service_all
on public.skin_scores
for all
to service_role
using (true)
with check (true);

drop policy if exists skin_heatmap_regions_service_all on public.skin_heatmap_regions;
create policy skin_heatmap_regions_service_all
on public.skin_heatmap_regions
for all
to service_role
using (true)
with check (true);

drop policy if exists skin_progress_service_all on public.skin_progress;
create policy skin_progress_service_all
on public.skin_progress
for all
to service_role
using (true)
with check (true);

grant select, insert, update on public.face_scans to authenticated;
grant select on public.liveness_results to authenticated;
grant select on public.skin_scores to authenticated;
grant select on public.skin_heatmap_regions to authenticated;
grant select on public.skin_progress to authenticated;

grant all on table public.face_scans to service_role;
grant all on table public.liveness_results to service_role;
grant all on table public.skin_scores to service_role;
grant all on table public.skin_heatmap_regions to service_role;
grant all on table public.skin_progress to service_role;

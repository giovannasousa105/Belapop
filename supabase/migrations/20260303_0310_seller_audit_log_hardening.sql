-- Hardening audit log for critical actions

alter table if exists public.seller_audit_logs
  add column if not exists role text,
  add column if not exists permission_used text,
  add column if not exists before_state jsonb,
  add column if not exists after_state jsonb,
  add column if not exists ip_address text,
  add column if not exists user_agent text;

create index if not exists idx_seller_audit_logs_created_at
  on public.seller_audit_logs (created_at desc);

create index if not exists idx_seller_audit_logs_actor
  on public.seller_audit_logs (actor_id, created_at desc);

create index if not exists idx_seller_audit_logs_action
  on public.seller_audit_logs (action, created_at desc);

-- Tenant-aware RLS for seller-scoped tables.
-- Closes owner-only gaps by allowing active seller team members inside the same tenant.
-- Residual caveat: fine-grained seller RBAC is still not tenant-scoped while seller_user_roles
-- and seller_user_permissions remain keyed only by user_id.

create or replace function public.is_seller_owner(p_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_seller_id is not null
    and auth.uid() is not null
    and exists (
      select 1
      from public.sellers s
      where s.id = p_seller_id
        and s.user_id = auth.uid()
    );
$$;

create or replace function public.is_seller_team_member(p_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_seller_id is not null
    and auth.uid() is not null
    and exists (
      select 1
      from public.seller_team_members stm
      where stm.seller_id = p_seller_id
        and stm.user_id = auth.uid()
        and stm.status = 'active'
    );
$$;

create or replace function public.has_seller_tenant_access(p_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin(auth.uid())
    or (
      p_seller_id is not null
      and (
        public.is_seller_owner(p_seller_id)
        or public.is_seller_team_member(p_seller_id)
      )
    );
$$;

create or replace function public.has_store_tenant_access(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_seller_tenant_access(p_store_id);
$$;

revoke all on function public.is_seller_owner(uuid) from public;
revoke all on function public.is_seller_team_member(uuid) from public;
revoke all on function public.has_seller_tenant_access(uuid) from public;
revoke all on function public.has_store_tenant_access(uuid) from public;

grant execute on function public.is_seller_owner(uuid) to authenticated, service_role;
grant execute on function public.is_seller_team_member(uuid) to authenticated, service_role;
grant execute on function public.has_seller_tenant_access(uuid) to authenticated, service_role;
grant execute on function public.has_store_tenant_access(uuid) to authenticated, service_role;

drop policy if exists seller_team_members_select on public.seller_team_members;
create policy seller_team_members_select
on public.seller_team_members
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_team_invites_select on public.seller_team_invites;
create policy seller_team_invites_select
on public.seller_team_invites
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists audit_log_select_scope on public.audit_log;
create policy audit_log_select_scope
on public.audit_log
for select
to authenticated
using (public.has_store_tenant_access(store_id));

drop policy if exists finance_adjustments_select_scope on public.finance_adjustments;
create policy finance_adjustments_select_scope
on public.finance_adjustments
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists finance_adjustment_approvals_select_scope on public.finance_adjustment_approvals;
create policy finance_adjustment_approvals_select_scope
on public.finance_adjustment_approvals
for select
to authenticated
using (
  exists (
    select 1
    from public.finance_adjustments fa
    where fa.id = finance_adjustment_approvals.adjustment_id
      and public.has_seller_tenant_access(fa.seller_id)
  )
);

drop policy if exists ledger_journals_select_scope on public.ledger_journals;
create policy ledger_journals_select_scope
on public.ledger_journals
for select
to authenticated
using (public.has_store_tenant_access(store_id));

drop policy if exists ledger_entries_select_scope on public.ledger_entries;
create policy ledger_entries_select_scope
on public.ledger_entries
for select
to authenticated
using (public.has_store_tenant_access(store_id));

drop policy if exists seller_orders_select_scope on public.seller_orders;
create policy seller_orders_select_scope
on public.seller_orders
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_order_snapshot_select_scope on public.seller_order_financial_snapshot;
create policy seller_order_snapshot_select_scope
on public.seller_order_financial_snapshot
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_scores_select_scope on public.seller_scores;
create policy seller_scores_select_scope
on public.seller_scores
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists product_scores_select_scope on public.product_scores;
create policy product_scores_select_scope
on public.product_scores
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists product_ranking_snapshot_select_scope on public.product_ranking_snapshot;
create policy product_ranking_snapshot_select_scope
on public.product_ranking_snapshot
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_fee_rules_select_scope on public.seller_fee_rules;
create policy seller_fee_rules_select_scope
on public.seller_fee_rules
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_order_shipping_quotes_select_scope on public.seller_order_shipping_quotes;
create policy seller_order_shipping_quotes_select_scope
on public.seller_order_shipping_quotes
for select
to authenticated
using (
  exists (
    select 1
    from public.seller_orders so
    where so.id = seller_order_shipping_quotes.seller_order_id
      and public.has_seller_tenant_access(so.seller_id)
  )
);

drop policy if exists seller_payouts_select_scope on public.seller_payouts;
create policy seller_payouts_select_scope
on public.seller_payouts
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_payout_items_select_scope on public.seller_payout_items;
create policy seller_payout_items_select_scope
on public.seller_payout_items
for select
to authenticated
using (
  exists (
    select 1
    from public.seller_payouts sp
    where sp.id = seller_payout_items.seller_payout_id
      and public.has_seller_tenant_access(sp.seller_id)
  )
);

drop policy if exists seller_risk_profiles_select_scope on public.seller_risk_profiles;
create policy seller_risk_profiles_select_scope
on public.seller_risk_profiles
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_risk_signals_select_scope on public.seller_risk_signals;
create policy seller_risk_signals_select_scope
on public.seller_risk_signals
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_holdbacks_select_scope on public.seller_holdbacks;
create policy seller_holdbacks_select_scope
on public.seller_holdbacks
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists return_requests_customer_or_seller on public.return_requests;
create policy return_requests_customer_or_seller
on public.return_requests
for select
to authenticated
using (
  customer_id = auth.uid()
  or public.has_seller_tenant_access(seller_id)
);

drop policy if exists logistics_exceptions_seller_or_admin_select on public.logistics_exceptions;
create policy logistics_exceptions_seller_or_admin_select
on public.logistics_exceptions
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists brand_partnerships_select_owner_or_admin on public.brand_partnerships;
create policy brand_partnerships_select_owner_or_admin
on public.brand_partnerships
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

grant select on public.seller_team_members to authenticated;
grant select on public.seller_team_invites to authenticated;
grant select on public.audit_log to authenticated;
grant select on public.finance_adjustments to authenticated;
grant select on public.finance_adjustment_approvals to authenticated;
grant select on public.ledger_journals to authenticated;
grant select on public.ledger_entries to authenticated;
grant select on public.seller_orders to authenticated;
grant select on public.seller_order_financial_snapshot to authenticated;

grant all on public.seller_team_members to service_role;
grant all on public.seller_team_invites to service_role;
grant all on public.audit_log to service_role;
grant all on public.finance_adjustments to service_role;
grant all on public.finance_adjustment_approvals to service_role;
grant all on public.ledger_journals to service_role;
grant all on public.ledger_entries to service_role;
grant all on public.seller_orders to service_role;
grant all on public.seller_order_financial_snapshot to service_role;
grant all on public.seller_scores to service_role;
grant all on public.product_scores to service_role;
grant all on public.product_ranking_snapshot to service_role;

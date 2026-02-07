-- Order status history: auto insert on create/change

create or replace function public.log_order_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, status, created_at)
    values (new.id, new.status, coalesce(new.created_at, now()));
  elsif (tg_op = 'UPDATE') then
    if (new.status is distinct from old.status) then
      insert into public.order_status_history (order_id, status, created_at)
      values (new.id, new.status, now());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_status_history on public.orders;
create trigger trg_orders_status_history
after insert or update of status on public.orders
for each row execute function public.log_order_status_history();

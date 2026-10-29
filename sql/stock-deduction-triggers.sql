-- Run this in the Supabase SQL Editor if completed orders are not reducing
-- product stock. Requires public.orders, public.order_items, and
-- public.products to exist. Re-running replaces the functions and triggers.

create or replace function public.decrement_stock_on_completed_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'COMPLETED' and old.status is distinct from 'COMPLETED' then
    update public.products p
    set stock_quantity = greatest(p.stock_quantity - oi.quantity, 0)
    from public.order_items oi
    where oi.order_id = new.id
      and oi.product_id = p.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_decrement_stock_on_completed_order on public.orders;
create trigger trg_decrement_stock_on_completed_order
  after update on public.orders
  for each row
  execute function public.decrement_stock_on_completed_order();

create or replace function public.decrement_stock_on_insert_completed_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'COMPLETED' then
    update public.products p
    set stock_quantity = greatest(p.stock_quantity - oi.quantity, 0)
    from public.order_items oi
    where oi.order_id = new.id
      and oi.product_id = p.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_decrement_stock_on_insert_completed_order on public.orders;
create trigger trg_decrement_stock_on_insert_completed_order
  after insert on public.orders
  for each row
  execute function public.decrement_stock_on_insert_completed_order();

-- Orders reserve inventory before a Lipila prompt is sent. This prevents two
-- customers from paying for the same last unit. A confirmed failure releases it.
drop trigger if exists trg_decrement_stock_on_completed_order on public.orders;
drop trigger if exists trg_decrement_stock_on_insert_completed_order on public.orders;
drop function if exists public.decrement_stock_on_completed_order();
drop function if exists public.decrement_stock_on_insert_completed_order();

alter table public.order_items
  add column if not exists stock_before integer check (stock_before >= 0);

create or replace function public.reserve_stock_for_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.order_status;
  prior_stock integer;
begin
  select status into current_status
  from public.orders
  where id = new.order_id
  for update;

  if current_status is distinct from 'PENDING' then
    raise exception 'Order must be pending before reserving stock';
  end if;

  select stock_quantity into prior_stock
  from public.products
  where id = new.product_id
  for update;

  if prior_stock is null or prior_stock < new.quantity then
    raise exception 'Insufficient stock for product %', new.product_id;
  end if;

  new.stock_before := prior_stock;
  update public.products
  set stock_quantity = prior_stock - new.quantity
  where id = new.product_id;

  return new;
end;
$$;

drop trigger if exists trg_reserve_stock_for_order_item on public.order_items;
create trigger trg_reserve_stock_for_order_item
  before insert on public.order_items
  for each row
  execute function public.reserve_stock_for_order_item();

create or replace function public.release_stock_for_failed_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'PENDING' and new.status = 'FAILED' then
    update public.products p
    set stock_quantity = p.stock_quantity + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id
      and oi.product_id = p.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_release_stock_for_failed_order on public.orders;
create trigger trg_release_stock_for_failed_order
  after update on public.orders
  for each row
  execute function public.release_stock_for_failed_order();

create or replace function public.lipila_checkout_ready()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'order_items'
        and t.tgname = 'trg_reserve_stock_for_order_item'
        and not t.tgisinternal
    )
    and exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'orders'
        and t.tgname = 'trg_release_stock_for_failed_order'
        and not t.tgisinternal
    )
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'order_items'
        and column_name = 'stock_before'
    )
    and exists (
      select 1
      from pg_type pt
      join pg_namespace pn on pn.oid = pt.typnamespace
      join pg_enum pe on pe.enumtypid = pt.oid
      where pn.nspname = 'public'
        and pt.typname = 'payment_method'
        and pe.enumlabel = 'ZAMTEL_MONEY'
    );
$$;

revoke all on function public.lipila_checkout_ready() from public, anon, authenticated;
grant execute on function public.lipila_checkout_ready() to service_role;

notify pgrst, 'reload schema';

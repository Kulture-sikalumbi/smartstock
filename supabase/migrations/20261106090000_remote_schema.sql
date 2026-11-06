-- ============================================================================
-- Smart Stock — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  price               numeric(10, 2) not null check (price >= 0),
  category            text not null,
  image_url           text,
  stock_quantity      integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_at          timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create type public.order_status as enum ('PENDING', 'COMPLETED', 'FAILED');
create type public.payment_method as enum ('MTN_MOMO', 'AIRTEL_MONEY', 'BANK_CARD');

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null,
  customer_phone  text not null,
  payment_method  public.payment_method not null,
  status          public.order_status not null default 'PENDING',
  total_amount    numeric(10, 2) not null check (total_amount >= 0),
  created_at      timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ----------------------------------------------------------------------------
-- order_items
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete restrict,
  product_name  text not null,
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(10, 2) not null check (unit_price >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- ----------------------------------------------------------------------------
-- Admin notification recipients
-- ----------------------------------------------------------------------------
create table if not exists public.admin_notification_recipients (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email = lower(btrim(email))),
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- Trigger: decrement stock_quantity when an order becomes COMPLETED
-- ============================================================================
create or replace function public.decrement_stock_on_completed_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act the moment an order transitions INTO the COMPLETED state,
  -- so re-saving an already-completed order never double-decrements stock.
  if new.status = 'COMPLETED' and (old.status is distinct from 'COMPLETED') then
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

-- Also handle orders inserted directly as COMPLETED (e.g. seed data / backfills).
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

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_notification_recipients enable row level security;

-- Public (anon) read access to the product catalogue.
create policy "Public can view products"
  on public.products for select
  using (true);

-- Writes to products/orders/order_items are performed by the server using
-- the service role key (see lib/supabase/server.ts), which bypasses RLS.
-- No public write policies are defined so the anon key stays read-only.

-- ============================================================================

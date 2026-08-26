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

-- Public (anon) read access to the product catalogue.
create policy "Public can view products"
  on public.products for select
  using (true);

-- Writes to products/orders/order_items are performed by the server using
-- the service role key (see lib/supabase/server.ts), which bypasses RLS.
-- No public write policies are defined so the anon key stays read-only.

-- ============================================================================
-- Seed data (optional) — sample products to get started
-- ============================================================================
insert into public.products (name, description, price, category, image_url, stock_quantity, low_stock_threshold)
values
  ('Wireless Earbuds Pro', 'Noise-cancelling wireless earbuds with 24h battery life.', 249.99, 'Electronics', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80', 18, 5),
  ('Smart Fitness Band', 'Track steps, heart rate, and sleep with a 10-day battery.', 189.50, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', 3, 5),
  ('Bag of Rice (25kg)', 'Premium long grain parboiled rice.', 320.00, 'Groceries', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', 42, 10),
  ('Cooking Oil (5L)', 'Refined vegetable cooking oil.', 95.00, 'Groceries', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', 8, 10),
  ('Men''s Casual Shirt', 'Breathable cotton-blend shirt, available in multiple sizes.', 120.00, 'Fashion', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80', 25, 8),
  ('Ladies'' Sneakers', 'Lightweight everyday sneakers with cushioned sole.', 210.00, 'Fashion', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80', 4, 5),
  ('Non-Stick Cooking Pot Set', '5-piece non-stick cookware set for everyday cooking.', 380.00, 'Home & Living', 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=600&q=80', 12, 4),
  ('LED Desk Lamp', 'Adjustable brightness desk lamp with USB charging port.', 75.00, 'Home & Living', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80', 30, 10),
  ('Shea Butter Body Lotion', 'Moisturizing body lotion enriched with natural shea butter.', 45.00, 'Beauty & Health', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80', 2, 6),
  ('A4 Exercise Books (Pack of 10)', '80-page ruled exercise books, pack of 10.', 38.00, 'Stationery', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=80', 60, 15)
on conflict do nothing;

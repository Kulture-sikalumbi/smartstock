-- Run this once in the Supabase SQL Editor for an existing Smart Stock project.
-- The server accesses this table with the service-role key; no browser policies
-- are added, so customers using the anon key cannot read or change recipients.

create table if not exists public.admin_notification_recipients (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email = lower(btrim(email))),
  created_at  timestamptz not null default now()
);

alter table public.admin_notification_recipients enable row level security;

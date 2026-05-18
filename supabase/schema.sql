-- Klik — Supabase schema
-- Run this once in the Supabase SQL editor for your project.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  gemini_api_key text,
  preferred_model text default 'nano-banana-2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Explicit grants. Supabase normally adds these via default privileges,
-- but if the table was created before those defaults were in place (or via
-- a tool that bypassed them) the role gets "permission denied for table
-- profiles" even though RLS policies exist. Grant once, then RLS gates rows.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.profiles
  to anon, authenticated, service_role;

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row on signup so we always have one to write to.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: anyone who signed up before the trigger existed has no
-- profile row, which surfaces as "No Gemini API key on file" or an empty
-- Settings form. Create rows for them now.
insert into public.profiles (id)
  select id from auth.users
  on conflict (id) do nothing;

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

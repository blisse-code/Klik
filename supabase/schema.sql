-- Klik — Supabase schema
-- Run this once in the Supabase SQL editor for your project.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Provider chain: an ordered list of provider ids the chain executor walks
-- top-to-bottom on each generation. 'local' is the always-available
-- client-side WebGL filter fallback and lives at the end of the chain.
alter table public.profiles
  add column if not exists provider_keys jsonb not null default '{}'::jsonb;
alter table public.profiles
  add column if not exists provider_order jsonb not null
  default '["gemini","openai","xai","fal","local"]'::jsonb;

-- Migrate older single-key columns into the new structure if they still
-- exist from a previous schema, then drop them.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'gemini_api_key'
  ) then
    update public.profiles
      set provider_keys =
        coalesce(provider_keys, '{}'::jsonb)
        || jsonb_build_object('gemini', gemini_api_key)
      where gemini_api_key is not null
        and not (provider_keys ? 'gemini');
    alter table public.profiles drop column gemini_api_key;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'preferred_model'
  ) then
    alter table public.profiles drop column preferred_model;
  end if;
end $$;

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

insert into public.profiles (id)
  select id from auth.users
  on conflict (id) do nothing;

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

-- HugeAF user profiles — one row per user, created during onboarding.
-- Run in Supabase → SQL Editor. Click "Run and enable RLS" if prompted.

create table if not exists public.hugeaf_profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text,
  username       text unique,
  sex            text,
  age            integer,
  units          text default 'lb',
  height_cm      numeric,
  weight_kg      numeric,
  gym            text,
  city           text,
  state          text,
  goal           text,
  experience     text,
  days_per_week  integer,
  home_gym       text,
  onboarded      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.hugeaf_profiles enable row level security;

drop policy if exists "read own profile" on public.hugeaf_profiles;
create policy "read own profile" on public.hugeaf_profiles
  for select using (auth.uid() = id);

drop policy if exists "insert own profile" on public.hugeaf_profiles;
create policy "insert own profile" on public.hugeaf_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "update own profile" on public.hugeaf_profiles;
create policy "update own profile" on public.hugeaf_profiles
  for update using (auth.uid() = id);

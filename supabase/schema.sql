-- HugeAF database schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run.

-- ============================================================
-- workouts: one row per FINISHED workout session
-- The full per-exercise / per-set detail is stored as JSONB so we
-- don't need extra join tables; summary columns power stats & charts.
-- ============================================================
create table if not exists public.hugeaf_workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null default 'Workout',
  subtitle      text default '',
  started_at    timestamptz,
  finished_at   timestamptz not null default now(),
  duration_sec  integer not null default 0,
  total_volume  integer not null default 0,
  total_sets    integer not null default 0,
  exercises     jsonb   not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists hugeaf_workouts_user_finished_idx
  on public.hugeaf_workouts (user_id, finished_at desc);

-- ============================================================
-- Row Level Security: each user can only see/modify their own rows
-- ============================================================
alter table public.hugeaf_workouts enable row level security;

drop policy if exists "Users select own workouts" on public.hugeaf_workouts;
create policy "Users select own workouts"
  on public.hugeaf_workouts for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own workouts" on public.hugeaf_workouts;
create policy "Users insert own workouts"
  on public.hugeaf_workouts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own workouts" on public.hugeaf_workouts;
create policy "Users update own workouts"
  on public.hugeaf_workouts for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own workouts" on public.hugeaf_workouts;
create policy "Users delete own workouts"
  on public.hugeaf_workouts for delete
  using (auth.uid() = user_id);

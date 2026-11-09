-- Gym Candy: a user's own self-assessment ratings. Run in Supabase → SQL Editor.
create table if not exists public.hugeaf_gym_candy (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  rated_on      date not null default current_date,
  gym           text,
  exercise_name text,
  outfit        text,
  stance        integer,
  form          integer,
  effort        integer,
  arms          integer,
  chest         integer,
  back          integer,
  glutes        integer,
  legs          integer,
  height_cm     numeric,
  weight_kg     numeric,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists hugeaf_gym_candy_user_idx
  on public.hugeaf_gym_candy (user_id, rated_on desc);

alter table public.hugeaf_gym_candy enable row level security;

drop policy if exists "read own gym candy" on public.hugeaf_gym_candy;
create policy "read own gym candy" on public.hugeaf_gym_candy
  for select using (auth.uid() = user_id);

drop policy if exists "insert own gym candy" on public.hugeaf_gym_candy;
create policy "insert own gym candy" on public.hugeaf_gym_candy
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own gym candy" on public.hugeaf_gym_candy;
create policy "update own gym candy" on public.hugeaf_gym_candy
  for update using (auth.uid() = user_id);

drop policy if exists "delete own gym candy" on public.hugeaf_gym_candy;
create policy "delete own gym candy" on public.hugeaf_gym_candy
  for delete using (auth.uid() = user_id);

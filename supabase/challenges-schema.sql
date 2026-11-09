-- Challenges a user has joined + their progress. Run in Supabase → SQL Editor.
create table if not exists public.hugeaf_user_challenges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  challenge_id  text not null,
  progress      numeric not null default 0,
  last_checkin  date,
  completed     boolean not null default false,
  joined_at     timestamptz not null default now(),
  unique (user_id, challenge_id)
);

alter table public.hugeaf_user_challenges enable row level security;

drop policy if exists "read own challenges" on public.hugeaf_user_challenges;
create policy "read own challenges" on public.hugeaf_user_challenges
  for select using (auth.uid() = user_id);

drop policy if exists "insert own challenges" on public.hugeaf_user_challenges;
create policy "insert own challenges" on public.hugeaf_user_challenges
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own challenges" on public.hugeaf_user_challenges;
create policy "update own challenges" on public.hugeaf_user_challenges
  for update using (auth.uid() = user_id);

drop policy if exists "delete own challenges" on public.hugeaf_user_challenges;
create policy "delete own challenges" on public.hugeaf_user_challenges
  for delete using (auth.uid() = user_id);

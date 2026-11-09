-- HugeAF challenges CATALOG: admin-managed challenge definitions (replaces bundled
-- src/data/challenges.js). User participation stays in hugeaf_user_challenges,
-- which references challenge_id = this table's slug. Run in Supabase → SQL Editor.

create table if not exists public.hugeaf_challenges (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  image_url     text,
  tag           text,
  type          text not null default 'daily' check (type in ('daily', 'count', 'pr', 'workouts')),
  goal          integer not null default 1,
  unit          text not null default 'days',
  duration_days integer not null default 30,
  participants  integer not null default 0,
  summary       text,
  status        text not null default 'active' check (status in ('active', 'draft')),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hugeaf_challenges_active_idx
  on public.hugeaf_challenges (status, sort_order, created_at);

alter table public.hugeaf_challenges enable row level security;

-- Anyone can read active challenges.
drop policy if exists "read active challenges" on public.hugeaf_challenges;
create policy "read active challenges" on public.hugeaf_challenges
  for select using (status = 'active');

-- Admins can read everything (incl. drafts).
drop policy if exists "admin read all challenges cat" on public.hugeaf_challenges;
create policy "admin read all challenges cat" on public.hugeaf_challenges
  for select using (public.is_admin());

-- Admins can create / edit / delete.
drop policy if exists "admin write challenges cat" on public.hugeaf_challenges;
create policy "admin write challenges cat" on public.hugeaf_challenges
  for all using (public.is_admin()) with check (public.is_admin());

-- Generic updated_at trigger (reused across admin-managed tables).
create or replace function public.hugeaf_touch_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists hugeaf_challenges_touch_trg on public.hugeaf_challenges;
create trigger hugeaf_challenges_touch_trg
  before update on public.hugeaf_challenges
  for each row execute function public.hugeaf_touch_updated();

-- Seed the 4 original bundled challenges (slug = old id, so existing joins keep working).
insert into public.hugeaf_challenges
  (slug, title, image_url, tag, type, goal, unit, duration_days, participants, summary, status, sort_order)
values
  ('pushup-30', '30-Day Push-Up Test', '/assets/chal1.webp', '30 DAYS', 'daily', 30, 'days', 30, 2140,
   'Do your push-up set every day for 30 straight days. Check in each day to keep the streak alive.', 'active', 1),
  ('consistency-20', '20 Workouts in 30 Days', '/assets/hero.webp', '30 DAYS', 'workouts', 20, 'workouts', 30, 3120,
   'Log 20 workouts in a month. Counts automatically from every session you finish.', 'active', 2),
  ('pushup-1000', '1,000 Push-Ups', '/assets/chal3.webp', '1 WEEK', 'count', 1000, 'reps', 7, 1503,
   'Rack up 1,000 push-up reps in seven days. Log them as you go — anywhere, any time.', 'active', 3),
  ('squat-pr', 'Squat PR Challenge', '/assets/chal2.webp', '2 WEEKS', 'pr', 1, 'PR', 14, 860,
   'Set a new squat 1-rep-max before the clock runs out. Mark it the moment you hit it.', 'active', 4)
on conflict (slug) do nothing;

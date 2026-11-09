-- 10×3 strength program: per-user auto-regulating state. Run in Supabase → SQL Editor.
-- One row per user: their chosen press, current working weight, week, and a session log.

create table if not exists public.hugeaf_program_1030 (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  exercise   text not null default 'Flat Barbell Bench Press',
  unit       text not null default 'lb',
  weight     numeric not null default 0,
  increment  numeric not null default 5,
  week       integer not null default 1,
  sessions   jsonb not null default '[]'::jsonb,   -- [{date, week, weight, sets_completed, completed_all}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hugeaf_program_1030 enable row level security;

drop policy if exists "own 1030 select" on public.hugeaf_program_1030;
create policy "own 1030 select" on public.hugeaf_program_1030
  for select using (auth.uid() = user_id);

drop policy if exists "own 1030 insert" on public.hugeaf_program_1030;
create policy "own 1030 insert" on public.hugeaf_program_1030
  for insert with check (auth.uid() = user_id);

drop policy if exists "own 1030 update" on public.hugeaf_program_1030;
create policy "own 1030 update" on public.hugeaf_program_1030
  for update using (auth.uid() = user_id);

drop policy if exists "own 1030 delete" on public.hugeaf_program_1030;
create policy "own 1030 delete" on public.hugeaf_program_1030
  for delete using (auth.uid() = user_id);

-- Admins can read all rows (for the admin dashboard, consistent with other tables).
drop policy if exists "admin read all 1030" on public.hugeaf_program_1030;
create policy "admin read all 1030" on public.hugeaf_program_1030
  for select using (public.is_admin());

create or replace function public.hugeaf_touch_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists hugeaf_1030_touch_trg on public.hugeaf_program_1030;
create trigger hugeaf_1030_touch_trg
  before update on public.hugeaf_program_1030
  for each row execute function public.hugeaf_touch_updated();

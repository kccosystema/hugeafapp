-- Programs a user is following. Run in Supabase → SQL Editor.
create table if not exists public.hugeaf_user_programs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  program_id    text not null,
  current_week  integer not null default 1,
  started_at    timestamptz not null default now(),
  unique (user_id, program_id)
);

alter table public.hugeaf_user_programs enable row level security;

drop policy if exists "read own programs" on public.hugeaf_user_programs;
create policy "read own programs" on public.hugeaf_user_programs
  for select using (auth.uid() = user_id);

drop policy if exists "insert own programs" on public.hugeaf_user_programs;
create policy "insert own programs" on public.hugeaf_user_programs
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own programs" on public.hugeaf_user_programs;
create policy "update own programs" on public.hugeaf_user_programs
  for update using (auth.uid() = user_id);

drop policy if exists "delete own programs" on public.hugeaf_user_programs;
create policy "delete own programs" on public.hugeaf_user_programs
  for delete using (auth.uid() = user_id);

-- HugeAF ADMIN foundation.
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent).
--
-- What this sets up:
--   1. hugeaf_admins   — allowlist of admin user_ids (seeded with bobby@rawritup.com)
--   2. public.is_admin() — SECURITY DEFINER boolean, used by RLS + RPCs
--   3. admin-read RLS policies so admins can SELECT every user's rows
--   4. RPCs: admin_metrics(), admin_list_users(), admin_delete_user()
--
-- Security: every admin RPC guards with is_admin() and raises if not an admin.
-- SECURITY DEFINER lets these bypass RLS / read auth.users, but only after the
-- is_admin() gate passes, so a normal signed-in user gets nothing.

-- ─────────────────────────────────────────────────────────────
-- 1. Admin allowlist
-- ─────────────────────────────────────────────────────────────
create table if not exists public.hugeaf_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.hugeaf_admins enable row level security;

-- Seed the first admin by email (idempotent). Requires bobby to have signed in
-- at least once so the auth.users row exists.
insert into public.hugeaf_admins (user_id, email)
select id, email from auth.users where email = 'bobby@rawritup.com'
on conflict (user_id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 2. is_admin() — the single source of truth for admin access
--    (defined before any policy that references it)
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.hugeaf_admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;

-- Admins (and only admins) can read the admin list from the client.
drop policy if exists "admin read admins" on public.hugeaf_admins;
create policy "admin read admins" on public.hugeaf_admins
  for select using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 3. Admin-read RLS on every user-scoped table
--    (leaves the existing own-only policies intact; adds an OR path)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "admin read all profiles" on public.hugeaf_profiles;
create policy "admin read all profiles" on public.hugeaf_profiles
  for select using (public.is_admin());

drop policy if exists "admin read all workouts" on public.hugeaf_workouts;
create policy "admin read all workouts" on public.hugeaf_workouts
  for select using (public.is_admin());

drop policy if exists "admin read all challenges" on public.hugeaf_user_challenges;
create policy "admin read all challenges" on public.hugeaf_user_challenges
  for select using (public.is_admin());

drop policy if exists "admin read all programs" on public.hugeaf_user_programs;
create policy "admin read all programs" on public.hugeaf_user_programs
  for select using (public.is_admin());

drop policy if exists "admin read all gym candy" on public.hugeaf_gym_candy;
create policy "admin read all gym candy" on public.hugeaf_gym_candy
  for select using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 4a. App-wide metrics (single JSON payload for the dashboard)
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_metrics()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result json;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select json_build_object(
    'total_users',      (select count(*) from auth.users),
    'onboarded_users',  (select count(*) from public.hugeaf_profiles where onboarded),
    'new_users_7d',     (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'new_users_30d',    (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'total_workouts',   (select count(*) from public.hugeaf_workouts),
    'workouts_7d',      (select count(*) from public.hugeaf_workouts where finished_at > now() - interval '7 days'),
    'workouts_30d',     (select count(*) from public.hugeaf_workouts where finished_at > now() - interval '30 days'),
    'active_users_7d',  (select count(distinct user_id) from public.hugeaf_workouts where finished_at > now() - interval '7 days'),
    'active_users_30d', (select count(distinct user_id) from public.hugeaf_workouts where finished_at > now() - interval '30 days'),
    'total_sweat',      (select coalesce(sum(sweat), 0) from public.hugeaf_profiles),
    'gym_candy_count',  (select count(*) from public.hugeaf_gym_candy),
    'programs_followed',(select count(*) from public.hugeaf_user_programs),
    'challenges_joined',(select count(*) from public.hugeaf_user_challenges),
    'signups_daily', (
      select coalesce(json_agg(row_to_json(d) order by d.day), '[]'::json) from (
        select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*) as n
        from auth.users
        where created_at > now() - interval '30 days'
        group by 1
      ) d
    ),
    'workouts_daily', (
      select coalesce(json_agg(row_to_json(d) order by d.day), '[]'::json) from (
        select to_char(date_trunc('day', finished_at), 'YYYY-MM-DD') as day, count(*) as n
        from public.hugeaf_workouts
        where finished_at > now() - interval '30 days'
        group by 1
      ) d
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_metrics() from anon, public;
grant execute on function public.admin_metrics() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4b. User list (joins auth.users → profiles → workout rollup)
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_list_users()
returns table (
  id              uuid,
  email           text,
  display_name    text,
  username        text,
  onboarded       boolean,
  is_admin        boolean,
  sweat           integer,
  city            text,
  state           text,
  goal            text,
  experience      text,
  workout_count   bigint,
  last_workout    timestamptz,
  created_at      timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
    select
      u.id,
      u.email::text,
      p.display_name,
      p.username,
      coalesce(p.onboarded, false),
      (a.user_id is not null),
      coalesce(p.sweat, 0),
      p.city,
      p.state,
      p.goal,
      p.experience,
      coalesce(w.cnt, 0),
      w.last_workout,
      u.created_at,
      u.last_sign_in_at
    from auth.users u
    left join public.hugeaf_profiles p on p.id = u.id
    left join public.hugeaf_admins   a on a.user_id = u.id
    left join (
      select user_id, count(*) as cnt, max(finished_at) as last_workout
      from public.hugeaf_workouts
      group by user_id
    ) w on w.user_id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from anon, public;
grant execute on function public.admin_list_users() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4c. Delete a user (cascades all hugeaf_* data). Admins only; can't self-delete here.
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if target = auth.uid() then
    raise exception 'refusing to delete your own admin account here';
  end if;
  delete from auth.users where id = target;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from anon, public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

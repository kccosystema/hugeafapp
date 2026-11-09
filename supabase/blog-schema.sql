-- HugeAF blog: DB-backed posts (replaces bundled src/data/blog.js).
-- Run in Supabase → SQL Editor. Idempotent.

create table if not exists public.hugeaf_blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  category        text not null default 'Hypertrophy',
  excerpt         text,
  image_url       text,
  author          text not null default 'HugeAF Team',
  author_initials text not null default 'AF',
  read_min        integer not null default 4,
  featured        boolean not null default false,
  body            jsonb not null default '[]'::jsonb,
  status          text not null default 'draft' check (status in ('draft', 'published')),
  source          text not null default 'manual' check (source in ('manual', 'ai', 'seed')),
  prompt          text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists hugeaf_blog_published_idx
  on public.hugeaf_blog_posts (status, published_at desc);

alter table public.hugeaf_blog_posts enable row level security;

-- Anyone (even signed-out) can read published posts.
drop policy if exists "read published posts" on public.hugeaf_blog_posts;
create policy "read published posts" on public.hugeaf_blog_posts
  for select using (status = 'published');

-- Admins can read everything (incl. drafts).
drop policy if exists "admin read all posts" on public.hugeaf_blog_posts;
create policy "admin read all posts" on public.hugeaf_blog_posts
  for select using (public.is_admin());

-- Admins can create / edit / delete.
drop policy if exists "admin write posts" on public.hugeaf_blog_posts;
create policy "admin write posts" on public.hugeaf_blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- Keep updated_at fresh.
create or replace function public.hugeaf_blog_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists hugeaf_blog_touch_trg on public.hugeaf_blog_posts;
create trigger hugeaf_blog_touch_trg
  before update on public.hugeaf_blog_posts
  for each row execute function public.hugeaf_blog_touch();

-- Seed the 5 original bundled posts. Safe to re-run (on conflict do nothing).
insert into public.hugeaf_blog_posts
  (slug, title, category, excerpt, image_url, author, author_initials, read_min, featured, body, status, source, published_at)
values
  ('science-backed-tips-to-grow', '5 Science-Backed Tips To Actually Grow', 'Hypertrophy', 'The handful of principles that move the needle for natural lifters.', '/assets/prog2.webp', 'Dr. Mike R.', 'MR', 6, true, '[{"type":"p","text":"Building muscle isn''t complicated, but it does reward consistency and a few well-chosen principles. After years of coaching, these five make the biggest difference for natural lifters."},{"type":"h2","text":"1. Train close to failure"},{"type":"p","text":"Most growth happens in the last few hard reps. Leaving 1–2 reps in reserve on your working sets is the sweet spot between stimulus and recovery."},{"type":"quote","text":"Volume drives growth — but only the volume you can recover from."},{"type":"h2","text":"2. Prioritize progressive overload"},{"type":"p","text":"Add reps or weight over time. If the numbers in your log never move, neither will the mirror. This is exactly what your HugeAF tracker is for."},{"type":"h2","text":"3. Hit each muscle twice a week"},{"type":"p","text":"Frequency lets you accumulate more quality volume without frying any single session. Two moderate hits usually beat one brutal one."},{"type":"takeaways","items":["Take working sets within 1–2 reps of failure","Add a little weight or a rep each week","Train each muscle ~2× per week","Eat enough protein and sleep 7–9 hours"]}]'::jsonb, 'published', 'seed', '2026-06-24 09:00:00+00'),
  ('how-much-protein', 'How Much Protein Do You Really Need?', 'Nutrition', 'Cut through the noise — here is what the research actually supports.', '/assets/chal3.webp', 'Coach Sarah L.', 'SL', 4, false, '[{"type":"p","text":"Protein gets the most hype of any macronutrient, and for good reason — it is the raw material for muscle repair. But more is not always better."},{"type":"h2","text":"The simple number"},{"type":"p","text":"For most lifters, 0.7–1.0 grams per pound of bodyweight per day covers your bases. Going much higher rarely adds more muscle; it mostly adds grocery bills."},{"type":"quote","text":"Total daily protein matters far more than timing or shake windows."},{"type":"h2","text":"Spread it out"},{"type":"p","text":"Aim for 3–4 meals with 30–50g of protein each. This keeps muscle protein synthesis elevated across the day without any fancy supplementation."},{"type":"takeaways","items":["Target ~0.8 g per lb of bodyweight daily","Split across 3–4 meals","Whole foods first; shakes to top up"]}]'::jsonb, 'published', 'seed', '2026-06-20 09:00:00+00'),
  ('sleep-underrated-supplement', 'Sleep Is The Most Underrated Supplement', 'Recovery', 'No powder in the world beats a consistent seven to nine hours.', '/assets/prog1.webp', 'Dr. Mike R.', 'MR', 5, false, '[{"type":"p","text":"You can nail training and nutrition and still stall if you are chronically under-slept. Recovery is when the adaptation actually happens."},{"type":"h2","text":"Why it matters"},{"type":"p","text":"Deep sleep is when growth hormone peaks and your nervous system resets. Skimp on it and strength, appetite control, and motivation all suffer."},{"type":"quote","text":"You don’t grow in the gym — you grow while you sleep off the gym."},{"type":"takeaways","items":["Aim for 7–9 hours, consistently","Keep a regular sleep and wake time","Cut screens and caffeine before bed"]}]'::jsonb, 'published', 'seed', '2026-06-16 09:00:00+00'),
  ('progressive-overload-explained', 'Progressive Overload, Explained Simply', 'Hypertrophy', 'The one principle underneath every good program.', '/assets/prog3.webp', 'Coach Sarah L.', 'SL', 7, false, '[{"type":"p","text":"Every effective program is just a clever way to apply one idea: gradually ask your body to do a little more than last time."},{"type":"h2","text":"Ways to progress"},{"type":"p","text":"Add weight, add reps, add a set, improve your form, or shorten rest. You do not need all of them at once — pick one lever and nudge it each week."},{"type":"quote","text":"If the log never changes, the physique never changes."},{"type":"takeaways","items":["Beat last session by a rep or a little weight","Track everything so you know your numbers","Deload when progress stalls for 2–3 weeks"]}]'::jsonb, 'published', 'seed', '2026-06-11 09:00:00+00'),
  ('habits-that-survive-bad-days', 'Building A Habit That Survives Bad Days', 'Mindset', 'Consistency beats intensity — here is how to make it stick.', '/assets/chal1.webp', 'Coach Sarah L.', 'SL', 3, false, '[{"type":"p","text":"Motivation is a nice bonus, not a plan. The lifters who make it long-term build systems that keep going even when they do not feel like it."},{"type":"quote","text":"On bad days, shrink the goal — never skip it entirely."},{"type":"h2","text":"The two-minute rule"},{"type":"p","text":"Commit to just showing up and doing one set. Nine times out of ten you finish the session; the tenth time, you still kept the streak alive."},{"type":"takeaways","items":["Never miss twice in a row","Lower the bar on bad days, don’t skip","Anchor training to an existing routine"]}]'::jsonb, 'published', 'seed', '2026-06-06 09:00:00+00')
on conflict (slug) do nothing;

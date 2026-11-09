-- Dev seed: sample workout history for YOUR account.
-- Run in Supabase → SQL Editor AFTER you've signed into the app at least once
-- (so your user exists in auth.users). Safe to re-run — see the DELETE below to reset.

-- Optional reset (uncomment to wipe your seeded rows before re-seeding):
-- delete from public.hugeaf_workouts
--   where user_id = (select id from auth.users order by created_at desc limit 1);

with me as (
  select id from auth.users order by created_at desc limit 1
)
insert into public.hugeaf_workouts
  (user_id, title, subtitle, started_at, finished_at, duration_sec, total_sets, total_volume, exercises)
select me.id, d.title, d.subtitle,
       d.fin - make_interval(secs => d.dur), d.fin, d.dur, d.sets, d.vol, '[]'::jsonb
from me, (values
  ('Push Day',  'Chest & Triceps', now() - interval '0 day', 3120, 22,  9420),
  ('Pull Day',  'Back & Biceps',   now() - interval '1 day', 2880, 20, 11200),
  ('Leg Day',   'Quads & Glutes',  now() - interval '2 day', 3600, 18, 15800),
  ('Upper Body','Push + Pull',     now() - interval '4 day', 3000, 21,  8900),
  ('Push Day',  'Chest & Triceps', now() - interval '6 day', 2700, 16,  7400),
  ('Leg Day',   'Posterior Chain', now() - interval '8 day', 3300, 19, 14200)
) as d(title, subtitle, fin, dur, sets, vol);

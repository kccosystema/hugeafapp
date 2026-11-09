-- Form guides: infographic photos users browse. Admin uploads a photo, AI reads
-- it to auto-fill title + category. Run in Supabase → SQL Editor.

create table if not exists public.hugeaf_form_guides (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null default 'Full Body',
  image_url   text not null,
  status      text not null default 'active' check (status in ('active', 'draft')),
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  source      text not null default 'manual' check (source in ('manual', 'ai')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists hugeaf_form_guides_active_idx
  on public.hugeaf_form_guides (status, sort_order, created_at desc);

alter table public.hugeaf_form_guides enable row level security;

drop policy if exists "read active guides" on public.hugeaf_form_guides;
create policy "read active guides" on public.hugeaf_form_guides
  for select using (status = 'active');

drop policy if exists "admin read all guides" on public.hugeaf_form_guides;
create policy "admin read all guides" on public.hugeaf_form_guides
  for select using (public.is_admin());

drop policy if exists "admin write guides" on public.hugeaf_form_guides;
create policy "admin write guides" on public.hugeaf_form_guides
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.hugeaf_touch_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists hugeaf_form_guides_touch_trg on public.hugeaf_form_guides;
create trigger hugeaf_form_guides_touch_trg
  before update on public.hugeaf_form_guides
  for each row execute function public.hugeaf_touch_updated();

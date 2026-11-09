-- Lets a signed-in user permanently delete their OWN account.
-- Deleting the auth.users row cascades to every hugeaf_* table
-- (all reference auth.users ON DELETE CASCADE), so this wipes all their data.
-- Run in Supabase → SQL Editor.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from anon, public;
grant execute on function public.delete_own_account() to authenticated;

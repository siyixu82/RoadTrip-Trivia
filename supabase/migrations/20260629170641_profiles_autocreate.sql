-- RoadTrip Trivia — auto-create a profiles row for every new auth user.
--
-- saves.user_id and history.user_id reference profiles(id), but anonymous
-- sign-in (Phase 5) only creates an auth.users row. Without a matching
-- profiles row, the first save/history insert would fail the FK. This trigger
-- creates the profile automatically (the canonical Supabase pattern).
--
-- SECURITY DEFINER so it runs as the table owner and bypasses RLS on insert;
-- the client also upserts its own profile defensively (ensureProfile), so the
-- app works even before this migration is applied.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

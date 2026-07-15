-- Migration 016: Add auth_user_id and user_id to activities if not exists
alter table public.activities
  add column if not exists user_id text,
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists activities_user_id_idx on public.activities(user_id);
create index if not exists activities_auth_user_id_idx on public.activities(auth_user_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activities_user_id_members_user_id_fk'
  ) then
    alter table public.activities
      add constraint activities_user_id_members_user_id_fk
      foreign key (user_id)
      references public.members(user_id)
      on delete set null;
  end if;
end $$;

-- Reload PostgREST schema cache to clear the cache error immediately
notify pgrst, 'reload schema';

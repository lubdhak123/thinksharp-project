-- Migration 013: Fix ambiguous application_id references in the approval RPC.
-- This creates a clearer approval function for the unified public.applications table.

create or replace function public.approve_application(target_application_id uuid)
returns table (
  approved_application_id uuid,
  generated_user_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.applications%rowtype;
  linked_auth_user_id uuid;
  member_user_id text;
begin
  select *
    into app
  from public.applications
  where public.applications.id = target_application_id
  for update;

  if not found then
    raise exception 'Application not found.';
  end if;

  select public.profiles.id
    into linked_auth_user_id
  from public.profiles
  where lower(public.profiles.email) = lower(app.email)
  limit 1;

  insert into public.members (
    application_id,
    auth_user_id,
    role,
    name,
    status,
    start_date,
    expected_end_date,
    email
  )
  values (
    app.id,
    linked_auth_user_id,
    app.applying_as,
    app.full_name,
    'Active',
    app.preferred_start_date,
    app.preferred_end_date,
    app.email
  )
  on conflict (application_id) do update
  set
    auth_user_id = coalesce(linked_auth_user_id, public.members.auth_user_id),
    role = excluded.role,
    name = excluded.name,
    status = 'Active',
    start_date = excluded.start_date,
    expected_end_date = excluded.expected_end_date,
    email = excluded.email,
    updated_at = now()
  returning public.members.user_id into member_user_id;

  update public.applications
  set
    status = 'Approved',
    user_id = member_user_id,
    auth_user_id = linked_auth_user_id,
    reviewed_at = now(),
    reviewed_by = 'Admin',
    updated_at = now()
  where public.applications.id = app.id;

  return query select app.id, member_user_id;
end;
$$;

grant execute on function public.approve_application(uuid) to anon, authenticated;

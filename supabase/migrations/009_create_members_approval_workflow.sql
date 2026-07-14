-- Migration 009: Module 4 Part 5 approval workflow.
-- Approving a volunteer_applications row creates a member record with TSF0001-style ID.

create sequence if not exists public.tsf_member_number_seq start with 1 increment by 1;

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('admin', 'volunteer', 'intern')) default 'volunteer',
  updated_at timestamptz default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  application_id uuid unique references public.volunteer_applications(id) on delete set null,
  user_id text not null unique default ('TSF' || lpad(nextval('public.tsf_member_number_seq')::text, 4, '0')),
  auth_user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('volunteer', 'intern')),
  name text not null,
  status text not null default 'Active' check (status in ('Active', 'Completed', 'Read Only')),
  start_date date,
  expected_end_date date,
  email text not null
);

alter table public.volunteer_applications
  add column if not exists user_id text unique,
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists members_user_id_idx on public.members(user_id);
create index if not exists members_email_idx on public.members(email);
create index if not exists members_role_idx on public.members(role);
create index if not exists members_status_idx on public.members(status);
create index if not exists volunteer_applications_user_id_idx on public.volunteer_applications(user_id);

alter table public.members enable row level security;

drop policy if exists "Anyone can read members during prototype" on public.members;
create policy "Anyone can read members during prototype"
  on public.members for select
  using (true);

drop policy if exists "Anyone can insert members during prototype" on public.members;
create policy "Anyone can insert members during prototype"
  on public.members for insert
  with check (true);

drop policy if exists "Anyone can update members during prototype" on public.members;
create policy "Anyone can update members during prototype"
  on public.members for update
  using (true)
  with check (true);

create or replace function public.approve_volunteer_application(application_id uuid)
returns table (
  approved_application_id uuid,
  generated_user_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.volunteer_applications%rowtype;
  linked_auth_user_id uuid;
  member_user_id text;
begin
  select *
    into app
  from public.volunteer_applications
  where id = application_id
  for update;

  if not found then
    raise exception 'Application not found.';
  end if;

  select p.id
    into linked_auth_user_id
  from public.profiles p
  where lower(p.email) = lower(app.email)
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
    auth_user_id = coalesce(excluded.auth_user_id, public.members.auth_user_id),
    role = excluded.role,
    name = excluded.name,
    status = 'Active',
    start_date = excluded.start_date,
    expected_end_date = excluded.expected_end_date,
    email = excluded.email,
    updated_at = now()
  returning public.members.user_id into member_user_id;

  update public.volunteer_applications
  set
    status = 'Approved',
    user_id = member_user_id,
    auth_user_id = linked_auth_user_id
  where id = app.id;

  return query select app.id, member_user_id;
end;
$$;

grant execute on function public.approve_volunteer_application(uuid) to anon, authenticated;

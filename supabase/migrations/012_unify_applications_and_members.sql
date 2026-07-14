-- Migration 012: Unify applications table and members approval workflow.
-- Redirect members references and approval RPCs to point to public.applications.

-- 1. Ensure public.applications has auth_user_id field
alter table public.applications add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create index if not exists applications_auth_user_id_idx on public.applications(auth_user_id);

-- 1b. Ensure the lifecycle/member tables exist before we re-point approval.
-- This makes the migration safe even if migration 009 was not run yet.
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
  application_id uuid unique,
  user_id text not null unique default ('TSF' || lpad(nextval('public.tsf_member_number_seq')::text, 4, '0')),
  auth_user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('volunteer', 'intern')),
  name text not null,
  status text not null default 'Active' check (status in ('Active', 'Completed', 'Read Only')),
  start_date date,
  expected_end_date date,
  email text not null,
  accepted_terms boolean not null default false,
  accepted_terms_at timestamptz
);

create index if not exists members_user_id_idx on public.members(user_id);
create index if not exists members_email_idx on public.members(email);
create index if not exists members_role_idx on public.members(role);
create index if not exists members_status_idx on public.members(status);
create index if not exists members_accepted_terms_idx on public.members(accepted_terms);

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

-- 2. Explicitly copy any old rows from volunteer_applications into applications if they do not exist
do $$
begin
  if to_regclass('public.volunteer_applications') is not null then
    insert into public.applications (
      id,
      created_at,
      full_name,
      date_of_birth,
      gender,
      mobile_number,
      email,
      current_city,
      current_state,
      applying_as,
      current_status,
      organization_name,
      preferred_start_date,
      preferred_end_date,
      expected_duration,
      availability,
      hours_per_week,
      preferred_mode,
      areas_of_interest,
      hear_about,
      reference_name,
      resume_url,
      linkedin_profile,
      emergency_contact_name,
      emergency_contact_relationship,
      emergency_contact_mobile,
      declaration_accuracy,
      declaration_unpaid,
      declaration_safeguarding,
      declaration_code_of_conduct,
      declaration_media_consent,
      status,
      user_id,
      auth_user_id
    )
    select
      id,
      created_at,
      full_name,
      coalesce(date_of_birth, current_date),
      coalesce(gender, 'Prefer not to say'),
      mobile_number,
      email,
      coalesce(current_city, 'Not provided'),
      coalesce(current_state, 'Not provided'),
      applying_as,
      coalesce(current_status, 'Other'),
      coalesce(organization_name, 'Not provided'),
      coalesce(preferred_start_date, current_date),
      coalesce(preferred_end_date, current_date),
      coalesce(expected_duration, 'Flexible'),
      coalesce(availability, 'Flexible'),
      greatest(coalesce(hours_per_week, 1), 1),
      coalesce(preferred_mode, 'Hybrid'),
      case when area_of_interest is null or area_of_interest = '' then array['Other'] else array[area_of_interest] end,
      coalesce(referral_source, 'Other'),
      coalesce(reference_name, 'Not provided'),
      coalesce(resume_url, 'legacy-record-no-resume'),
      linkedin_profile,
      coalesce(emergency_contact_name, 'Not provided'),
      coalesce(emergency_relationship, 'Not provided'),
      coalesce(emergency_mobile, 'Not provided'),
      declaration_accepted,
      declaration_accepted,
      declaration_accepted,
      declaration_accepted,
      declaration_accepted,
      case when status in ('Pending', 'Approved', 'Rejected') then status else 'Pending' end,
      user_id,
      auth_user_id
    from public.volunteer_applications
    on conflict (id) do nothing;
  end if;
end $$;

-- 3. Drop the old foreign key referencing public.volunteer_applications
do $$
declare
  fk_name text;
begin
  select conname
    into fk_name
  from pg_constraint
  where conrelid = 'public.members'::regclass
    and contype = 'f'
    and conkey = (
      select array_agg(attnum)
      from pg_attribute
      where attrelid = 'public.members'::regclass
        and attname = 'application_id'
    );

  if fk_name is not null then
    execute 'alter table public.members drop constraint ' || quote_ident(fk_name);
  end if;
end $$;

-- 4. Add the new foreign key referencing public.applications
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.members'::regclass
      and conname = 'members_application_id_fkey'
  ) then
    alter table public.members
      add constraint members_application_id_fkey
      foreign key (application_id)
      references public.applications(id)
      on delete set null;
  end if;
end $$;

-- 5. Recreate approval function targeting public.applications
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
  app public.applications%rowtype;
  linked_auth_user_id uuid;
  member_user_id text;
begin
  select *
    into app
  from public.applications
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
    auth_user_id = linked_auth_user_id
  where id = app.id;

  return query select app.id, member_user_id;
end;
$$;

grant execute on function public.approve_volunteer_application(uuid) to anon, authenticated;

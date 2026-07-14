-- Migration 006: Align Module 3 public applications with the admin review table.
-- Run this after the earlier application migrations. It is safe to run more than once.

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz,
  full_name text not null,
  date_of_birth date not null,
  gender text not null,
  mobile_number text not null,
  email text not null,
  current_city text not null,
  current_state text not null,
  applying_as text not null check (applying_as in ('volunteer', 'intern')),
  current_status text not null check (current_status in (
    'Student',
    'Working Professional',
    'Self-employed',
    'Freelancer',
    'Other'
  )),
  organization_name text not null,
  preferred_start_date date not null,
  preferred_end_date date not null,
  expected_duration text not null check (expected_duration in (
    'Less than 1 Month',
    '1 Month',
    '2 Months',
    '3 Months',
    '6 Months',
    'Flexible'
  )),
  availability text not null check (availability in ('Weekdays', 'Weekends', 'Flexible')),
  hours_per_week numeric not null check (hours_per_week > 0),
  preferred_mode text not null check (preferred_mode in ('Offline', 'Remote', 'Hybrid')),
  areas_of_interest text[] not null default '{}',
  hear_about text not null,
  reference_name text not null,
  resume_url text not null,
  linkedin_profile text,
  emergency_contact_name text not null,
  emergency_contact_relationship text not null,
  emergency_contact_mobile text not null,
  declaration_accuracy boolean not null default false,
  declaration_unpaid boolean not null default false,
  declaration_safeguarding boolean not null default false,
  declaration_code_of_conduct boolean not null default false,
  declaration_media_consent boolean not null default false,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  user_id text unique,
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by text
);

update applications
set
  date_of_birth = coalesce(date_of_birth, current_date),
  gender = coalesce(gender, 'Prefer not to say'),
  current_city = coalesce(nullif(current_city, ''), 'Not provided'),
  current_state = coalesce(nullif(current_state, ''), 'Not provided'),
  current_status = coalesce(current_status, 'Other'),
  organization_name = coalesce(nullif(organization_name, ''), 'Not provided'),
  preferred_start_date = coalesce(preferred_start_date, current_date),
  preferred_end_date = coalesce(preferred_end_date, current_date),
  expected_duration = coalesce(expected_duration, 'Flexible'),
  availability = coalesce(availability, 'Flexible'),
  hours_per_week = greatest(coalesce(hours_per_week, 1), 1),
  preferred_mode = coalesce(preferred_mode, 'Hybrid'),
  areas_of_interest = case when areas_of_interest is null or areas_of_interest = '{}' then array['Other'] else areas_of_interest end,
  hear_about = coalesce(nullif(hear_about, ''), 'Other'),
  reference_name = coalesce(nullif(reference_name, ''), 'Not provided'),
  resume_url = coalesce(nullif(resume_url, ''), 'legacy-record-no-resume'),
  emergency_contact_name = coalesce(nullif(emergency_contact_name, ''), 'Not provided'),
  emergency_contact_relationship = coalesce(nullif(emergency_contact_relationship, ''), 'Not provided'),
  emergency_contact_mobile = coalesce(nullif(emergency_contact_mobile, ''), 'Not provided');

alter table applications
  alter column date_of_birth set not null,
  alter column gender set not null,
  alter column current_city set not null,
  alter column current_state set not null,
  alter column current_status set not null,
  alter column organization_name set not null,
  alter column preferred_start_date set not null,
  alter column preferred_end_date set not null,
  alter column expected_duration set not null,
  alter column availability set not null,
  alter column hours_per_week set not null,
  alter column preferred_mode set not null,
  alter column hear_about set not null,
  alter column reference_name set not null,
  alter column resume_url set not null,
  alter column emergency_contact_name set not null,
  alter column emergency_contact_relationship set not null,
  alter column emergency_contact_mobile set not null;

alter table applications
  drop constraint if exists applications_hours_per_week_check,
  add constraint applications_hours_per_week_check check (hours_per_week > 0);

create index if not exists applications_status_idx on applications (status);
create index if not exists applications_applying_as_idx on applications (applying_as);
create index if not exists applications_created_at_idx on applications (created_at desc);
create index if not exists applications_email_idx on applications (email);

alter table applications enable row level security;

drop policy if exists "Anyone can submit applications" on applications;
create policy "Anyone can submit applications"
  on applications for insert
  with check (status = 'Pending');

drop policy if exists "Anyone can read applications during prototype" on applications;
create policy "Anyone can read applications during prototype"
  on applications for select
  using (true);

drop policy if exists "Anyone can update applications during prototype" on applications;
create policy "Anyone can update applications during prototype"
  on applications for update
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-resumes',
  'application-resumes',
  true,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload application resumes" on storage.objects;
create policy "Anyone can upload application resumes"
  on storage.objects for insert
  with check (bucket_id = 'application-resumes');

drop policy if exists "Anyone can read application resumes" on storage.objects;
create policy "Anyone can read application resumes"
  on storage.objects for select
  using (bucket_id = 'application-resumes');

do $$
begin
  if to_regclass('public.volunteer_applications') is not null then
    insert into applications (
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
      status
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
      case when status in ('Pending', 'Approved', 'Rejected') then status else 'Pending' end
    from volunteer_applications
    on conflict (id) do nothing;
  end if;
end $$;

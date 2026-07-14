-- Migration 005: Create volunteer_applications table (Module 3 – Application Portal)

create table if not exists volunteer_applications (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Personal Information
  full_name            text not null,
  date_of_birth        date,
  gender               text check (gender in ('Male', 'Female', 'Non-Binary', 'Prefer not to say')),
  mobile_number        text not null,
  email                text not null,
  current_city         text,
  current_state        text,

  -- Professional Information
  applying_as          text not null check (applying_as in ('volunteer', 'intern')),
  current_status       text check (current_status in (
                          'Student', 'Working Professional', 'Self-employed', 'Freelancer', 'Other'
                       )),
  organization_name    text,  -- school / college / company

  -- Availability
  preferred_start_date date,
  preferred_end_date   date,
  expected_duration    text check (expected_duration in (
                          'Less than 1 Month', '1 Month', '2 Months',
                          '3 Months', '6 Months', 'Flexible'
                       )),
  availability         text check (availability in ('Weekdays', 'Weekends', 'Flexible')),
  hours_per_week       integer check (hours_per_week > 0),

  -- Working Preference
  preferred_mode       text check (preferred_mode in ('Offline', 'Remote', 'Hybrid')),

  -- Area of Interest (stored as comma-separated text for simplicity without array extension)
  area_of_interest     text,

  -- Referral
  referral_source      text,
  reference_name       text,

  -- Documents
  resume_url           text,
  linkedin_profile     text,

  -- Emergency Contact
  emergency_contact_name     text,
  emergency_relationship     text,
  emergency_mobile           text,

  -- Declaration
  declaration_accepted boolean not null default false,

  -- Application Status (auto-assigned on insert)
  status               text not null default 'Pending'
                         check (status in ('Pending', 'Under Review', 'Approved', 'Rejected'))
);

-- Indexes for common lookups
create index if not exists va_status_idx        on volunteer_applications (status);
create index if not exists va_applying_as_idx   on volunteer_applications (applying_as);
create index if not exists va_email_idx         on volunteer_applications (email);
create index if not exists va_created_at_idx    on volunteer_applications (created_at desc);

-- Row-Level Security
alter table volunteer_applications enable row level security;

create policy "Anyone can submit an application"
  on volunteer_applications for insert
  with check (true);

create policy "Anyone can read applications"
  on volunteer_applications for select
  using (true);

create policy "Anyone can update application status"
  on volunteer_applications for update
  using (true);

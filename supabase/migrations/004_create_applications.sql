create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  updated_at timestamp,
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
  hours_per_week numeric not null default 0 check (hours_per_week >= 0),
  preferred_mode text not null check (preferred_mode in ('Offline', 'Remote', 'Hybrid')),
  areas_of_interest text[] not null default '{}',
  hear_about text not null,
  reference_name text,
  resume_url text,
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
  reviewed_at timestamp,
  reviewed_by text
);

create index if not exists applications_status_idx on applications (status);
create index if not exists applications_applying_as_idx on applications (applying_as);
create index if not exists applications_created_at_idx on applications (created_at desc);

alter table applications enable row level security;

create policy "Anyone can submit applications"
  on applications for insert
  with check (true);

create policy "Anyone can read applications during prototype"
  on applications for select
  using (true);

create policy "Anyone can update applications during prototype"
  on applications for update
  using (true)
  with check (true);

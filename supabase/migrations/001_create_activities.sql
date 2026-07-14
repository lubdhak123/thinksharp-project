create extension if not exists pgcrypto;

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  activity_date date not null,
  volunteer_name text not null,
  entry_type text not null default 'volunteer' check (entry_type in ('volunteer', 'intern')),
  volunteer_type text check (
    volunteer_type in (
      'Individual Volunteer',
      'Group Volunteer',
      'Corporate Volunteer',
      'Student Volunteer'
    )
  ),
  organisation text,
  location text not null,
  programme_name text,
  project_type text check (
    project_type in (
      'Student Teaching',
      'School Cleaning',
      'Plantation Drive',
      'Fundraising',
      'School Painting',
      'Other'
    )
  ),
  num_volunteers integer default 0 check (num_volunteers >= 0),
  individual_hours numeric default 0 check (individual_hours >= 0),
  group_hours numeric default 0 check (group_hours >= 0),
  beneficiaries_impacted integer default 0 check (beneficiaries_impacted >= 0),
  trees_planted integer default 0 check (trees_planted >= 0),
  activities_completed integer default 0 check (activities_completed >= 0),
  remarks text,
  submitted_by text,
  
  -- Intern-specific columns
  department text,
  intern_work_type text check (
    intern_work_type in (
      'AI Project',
      'Dashboard Development',
      'Curriculum Development',
      'Survey',
      'Data Analysis',
      'Student Teaching',
      'Research',
      'Documentation',
      'Other'
    )
  ),
  supervisor_name text,
  milestone text,
  internship_hours numeric default 0 check (internship_hours >= 0),
  deliverables_completed integer default 0 check (deliverables_completed >= 0),
  
  -- Staff In-Charge
  staff_in_charge text check (
    staff_in_charge in (
      'Rameshwar Khairnar',
      'Santosh Phad',
      'ThinkSharp Foundation Staff',
      'ThinkSharp Fellow'
    )
  )
);


create index if not exists activities_activity_date_idx on activities (activity_date desc);
create index if not exists activities_volunteer_type_idx on activities (volunteer_type);
create index if not exists activities_project_type_idx on activities (project_type);
create index if not exists activities_programme_name_idx on activities (programme_name);
create index if not exists activities_location_idx on activities (location);
create index if not exists activities_intern_work_type_idx on activities (intern_work_type);
create index if not exists activities_staff_in_charge_idx on activities (staff_in_charge);

alter table activities enable row level security;

create policy "Anyone can submit activities"
  on activities for insert
  with check (true);

create policy "Anyone can read activities"
  on activities for select
  using (true);

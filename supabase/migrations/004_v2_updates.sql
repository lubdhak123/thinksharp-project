-- Migration for V2 Requirements Alignment

-- 1. Add volunteering_hours column if not exists
alter table activities add column if not exists volunteering_hours numeric;

-- 2. Migrate existing individual and group hours to volunteering_hours for volunteer entries
update activities
set volunteering_hours = coalesce(individual_hours, 0) + coalesce(group_hours, 0)
where entry_type = 'volunteer' and volunteering_hours is null;

-- 3. Add internship_start_date and internship_end_date columns if not exist
alter table activities add column if not exists internship_start_date date;
alter table activities add column if not exists internship_end_date date;

-- 4. Re-apply constraints to ensure they match V2 specs exactly

-- Project Type constraint
alter table activities drop constraint if exists activities_project_type_check;
alter table activities add constraint activities_project_type_check
  check (
    project_type is null or project_type in (
      'Student Teaching',
      'School Cleaning',
      'Plantation Drive',
      'Fundraising',
      'School Painting',
      'Other'
    )
  );

-- Intern Work Type constraint
alter table activities drop constraint if exists activities_intern_work_type_check;
alter table activities add constraint activities_intern_work_type_check
  check (
    intern_work_type is null or intern_work_type in (
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
  );

-- Staff In-Charge constraint
alter table activities drop constraint if exists activities_staff_in_charge_check;
alter table activities add constraint activities_staff_in_charge_check
  check (
    staff_in_charge is null or staff_in_charge in (
      'Rameshwar Khairnar',
      'Santosh Phad',
      'ThinkSharp Foundation Staff',
      'ThinkSharp Fellow'
    )
  );

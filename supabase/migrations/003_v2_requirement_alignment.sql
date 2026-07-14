alter table activities
add column if not exists intern_work_type text;

alter table activities
add column if not exists beneficiaries_impacted integer default 0 check (beneficiaries_impacted >= 0);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'activities'
      and column_name = 'students_impacted'
  ) then
    execute 'update activities set beneficiaries_impacted = coalesce(beneficiaries_impacted, students_impacted, 0)';
    alter table activities drop column students_impacted;
  end if;
end $$;

update activities
set project_type = case project_type
  when 'Student Session' then 'Student Teaching'
  when 'STEM Activity' then 'Student Teaching'
  when 'Computer Session' then 'Student Teaching'
  when 'Donation Drive' then 'Fundraising'
  when 'Library Installation' then 'Other'
  when 'Book Mitra Activity' then 'Other'
  else project_type
end
where project_type is not null;

update activities
set staff_in_charge = case
  when staff_in_charge in ('Rameshwar Khairnar', 'Santosh Phad', 'ThinkSharp Foundation Staff', 'ThinkSharp Fellow') then staff_in_charge
  when staff_in_charge is null or staff_in_charge = '' then null
  else 'ThinkSharp Foundation Staff'
end;

update activities
set intern_work_type = case
  when intern_work_type is not null then intern_work_type
  when entry_type = 'intern' and department = 'Tech' then 'Dashboard Development'
  when entry_type = 'intern' and department = 'Research' then 'Research'
  when entry_type = 'intern' and department = 'Content' then 'Curriculum Development'
  when entry_type = 'intern' and department = 'Design' then 'Documentation'
  when entry_type = 'intern' and department = 'Outreach' then 'Survey'
  when entry_type = 'intern' then 'Other'
  else null
end;

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

create index if not exists activities_intern_work_type_idx
on activities (intern_work_type);

-- Migration 017: Align public.activities schema with v2 requirements and preserve data.

-- 1. Add user_id and auth_user_id columns
alter table public.activities add column if not exists user_id text;
alter table public.activities add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

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

-- 2. Add volunteering_hours column
alter table public.activities add column if not exists volunteering_hours numeric;

-- Migrate data to volunteering_hours from individual_hours + group_hours
update public.activities
set volunteering_hours = coalesce(individual_hours, 0) + coalesce(group_hours, 0)
where entry_type = 'volunteer' and volunteering_hours is null;

-- 3. Add beneficiaries_impacted column
alter table public.activities add column if not exists beneficiaries_impacted integer default 0 check (beneficiaries_impacted >= 0);

-- Migrate data to beneficiaries_impacted from students_impacted
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'activities'
      and column_name = 'students_impacted'
  ) then
    update public.activities 
    set beneficiaries_impacted = coalesce(students_impacted, 0)
    where beneficiaries_impacted = 0;
  end if;
end $$;

-- 4. Add intern_work_type column
alter table public.activities add column if not exists intern_work_type text;

-- Add check constraint for intern_work_type
alter table public.activities drop constraint if exists activities_intern_work_type_check;
alter table public.activities add constraint activities_intern_work_type_check
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

create index if not exists activities_intern_work_type_idx on public.activities (intern_work_type);

-- 5. Add internship_start_date and internship_end_date columns
alter table public.activities add column if not exists internship_start_date date;
alter table public.activities add column if not exists internship_end_date date;

-- Reload PostgREST schema cache to clear the cache error immediately
notify pgrst, 'reload schema';

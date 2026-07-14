alter table activities
add column if not exists staff_in_charge text;

create index if not exists activities_staff_in_charge_idx
on activities (staff_in_charge);

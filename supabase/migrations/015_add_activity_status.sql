-- Migration 015: Add status to activities table

alter table public.activities add column if not exists status text not null default 'Submitted' check (status in ('Submitted', 'Approved', 'Rejected'));

-- Update existing activities to 'Approved' so previous submissions are approved
update public.activities set status = 'Approved' where status = 'Submitted';

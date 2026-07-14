-- Migration 014: Alter members status constraint and add lifecycle tracking fields.

-- 1. Drop old status check constraint
alter table public.members drop constraint if exists members_status_check;

-- 2. Update existing 'Read Only' statuses to 'Completed'
update public.members set status = 'Completed' where status = 'Read Only';

-- 3. Add new tracking columns
alter table public.members add column if not exists completed_at timestamptz;
alter table public.members add column if not exists suspended_at timestamptz;
alter table public.members add column if not exists reactivated_at timestamptz;
alter table public.members add column if not exists certificate_number text unique;

-- 4. Re-add status constraint with 'Active', 'Completed', 'Suspended'
alter table public.members add constraint members_status_check check (status in ('Active', 'Completed', 'Suspended'));

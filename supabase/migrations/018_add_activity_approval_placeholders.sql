-- Migration 018: Add activity approval placeholder columns for future-proofing
alter table public.activities
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text;

-- Reload PostgREST schema cache to clear the cache error immediately
notify pgrst, 'reload schema';

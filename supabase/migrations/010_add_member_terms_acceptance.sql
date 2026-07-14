-- Migration 010: Module 4 Part 6 first-login agreement acceptance.

alter table public.members
  add column if not exists accepted_terms boolean not null default false,
  add column if not exists accepted_terms_at timestamptz;

create index if not exists members_accepted_terms_idx on public.members(accepted_terms);

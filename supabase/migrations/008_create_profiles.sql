-- Migration 008: Create public.profiles table linking auth users to roles

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('admin', 'volunteer', 'intern')) default 'volunteer',
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Allow read access to profiles for authenticated users"
  on public.profiles for select
  using (true);

create policy "Allow profiles creation on signup"
  on public.profiles for insert
  with check (true);

create policy "Allow users to update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to create profile when auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'volunteer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

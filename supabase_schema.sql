-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
-- This table mirrors the auth.users table and stores public profile info
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  subscription_tier text default 'free',
  is_admin boolean default false,
  is_tester boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies for Profiles
create policy "Users can view their own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on profiles for update 
  using (auth.uid() = id);

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- RESUMES TABLE
-- Stores parsed resume data blocks
create table resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text not null,
  content jsonb not null, -- Stores the ResumeBlock[] array
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table resumes enable row level security;

-- PRIVACY POLICY: Users can ONLY see their own resumes
create policy "Users can view own resumes" 
  on resumes for select 
  using (auth.uid() = user_id);

create policy "Users can insert own resumes" 
  on resumes for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own resumes" 
  on resumes for update 
  using (auth.uid() = user_id);

create policy "Users can delete own resumes" 
  on resumes for delete 
  using (auth.uid() = user_id);


-- JOBS TABLE
-- Stores saved jobs and analysis
create table jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  job_title text,
  company text,
  original_text text,
  url text,
  analysis jsonb, -- Stores the Analysis result
  status text default 'new',
  date_added timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table jobs enable row level security;

-- PRIVACY POLICY: Users can ONLY see their own jobs
create policy "Users can view own jobs" 
  on jobs for select 
  using (auth.uid() = user_id);

create policy "Users can insert own jobs" 
  on jobs for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own jobs" 
  on jobs for update 
  using (auth.uid() = user_id);

create policy "Users can delete own jobs" 
  on jobs for delete 
  using (auth.uid() = user_id);

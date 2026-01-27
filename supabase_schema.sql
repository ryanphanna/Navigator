-- JOB FIT - CONSOLIDATED SUPABASE SCHEMA
-- This file contains the complete database structure, including tables, 
-- security policies (RLS), functions, and performance indexes.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- PROFILES: Mirrors auth.users and stores public profile/subscription info
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  subscription_tier text default 'free',
  is_admin boolean default false,
  is_tester boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RESUMES: Stores parsed resume data blocks
create table resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text not null,
  content jsonb not null, -- Stores the ResumeBlock[] array
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- JOBS: Stores saved jobs and analysis
create table jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  job_title text,
  company text,
  original_text text,
  url text,
  analysis jsonb, -- Stores the Analysis result
  status text default 'new' check (status in ('new', 'saved', 'applied', 'interview', 'offer', 'rejected', 'ghosted')),
  date_added timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FEEDBACK: Stores user feedback on AI responses
create table feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  job_id text not null, 
  rating int not null, -- 1 for good, -1 for bad
  context text, -- e.g. "cover_letter" or "resume"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVITE CODES: Manages access to the invite-only beta
create table invite_codes (
  code text primary key,
  remaining_uses int not null default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DAILY USAGE: Rate limiting and tracking for requests
create table daily_usage (
  user_id uuid references auth.users(id) not null,
  date date not null default current_date,
  request_count int not null default 0,
  primary key (user_id, date)
);

-- USER_SKILLS: Stores user's verified skills with proficiency levels
create table user_skills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text not null,
  proficiency text not null check (proficiency in ('learning', 'comfortable', 'expert')),
  evidence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- 3. SECURITY (Row Level Security)

alter table profiles enable row level security;
alter table resumes enable row level security;
alter table jobs enable row level security;
alter table feedback enable row level security;
alter table invite_codes enable row level security;
alter table daily_usage enable row level security;
alter table user_skills enable row level security;

-- Profile Policies
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Resume Policies
create policy "Users can manage own resumes" on resumes for all using (auth.uid() = user_id);

-- Job Policies
create policy "Users can manage own jobs" on jobs for all using (auth.uid() = user_id);

-- User Skills Policies
create policy "Users can manage own skills" on user_skills for all using (auth.uid() = user_id);

-- Feedback Policies
create policy "Users can insert own feedback" on feedback for insert with check (auth.uid() = user_id);

-- Usage Policies
create policy "Users can view own usage" on daily_usage for select using (auth.uid() = user_id);

-- Invite Codes: Only Service Role/Functions can view/edit. No direct public policies.

-- 4. FUNCTIONS & TRIGGERS

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, is_admin, is_tester)
  values (new.id, new.email, false, false);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Secure function to redeem invite codes
create or replace function redeem_invite_code(code_input text)
returns boolean
language plpgsql
security definer
as $$
declare
  valid_code boolean;
begin
  select exists(
    select 1 from invite_codes 
    where code = code_input 
    and is_active = true 
    and remaining_uses > 0
  ) into valid_code;

  if valid_code then
    update invite_codes 
    set remaining_uses = remaining_uses - 1 
    where code = code_input;
    return true;
  else
    return false;
  end if;
end;
$$;

-- 5. PERFORMANCE INDEXES

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_tester ON profiles(is_tester) WHERE is_tester = true;
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(subscription_tier);

-- Resumes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);

-- Jobs
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_date_added ON jobs(date_added DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_user_date ON jobs(user_id, date_added DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- User Skills
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_name ON user_skills(name);
CREATE INDEX IF NOT EXISTS idx_user_skills_proficiency ON user_skills(proficiency);

-- 6. INITIAL SEEDING
insert into invite_codes (code, remaining_uses) values ('JOBFIT2024', 9999) on conflict do nothing;

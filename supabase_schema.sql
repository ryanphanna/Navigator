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
  job_analyses_count int default 0,
  total_ai_calls int default 0,
  last_analysis_date timestamp with time zone,
  inbound_email_token text unique,
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
  source_type text default 'manual',
  analysis jsonb, -- Stores the Analysis result
  status text default 'new' check (status in ('new', 'saved', 'applied', 'interview', 'offer', 'rejected', 'ghosted', 'feed', 'error')),
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
  token_count int not null default 0,
  primary key (user_id, date)
);

  unique(user_id, name)
);

-- LOGS: Stores individual AI interaction history
create table logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  event_type text not null,
  model_name text not null,
  prompt_text text,
  response_text text,
  latency_ms int,
  status text check (status in ('success', 'error')),
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROLE_MODELS: Stores target professional profiles for gap analysis
create table role_models (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text not null,
  content jsonb not null, -- Stores the RoleModelProfile
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TARGET_JOBS: Stores high-level career goals and associated roadmaps
create table target_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  description text,
  role_model_id uuid references role_models(id),
  gap_analysis jsonb,
  roadmap jsonb,
  type text default 'goal' check (type in ('goal', 'role_model')),
  strict_mode boolean default true,
  date_added timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SECURITY (Row Level Security)

alter table profiles enable row level security;
alter table resumes enable row level security;
alter table jobs enable row level security;
alter table feedback enable row level security;
alter table invite_codes enable row level security;
alter table daily_usage enable row level security;
alter table user_skills enable row level security;
alter table role_models enable row level security;
alter table target_jobs enable row level security;

-- Profile Policies
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  (select is_admin from profiles where id = auth.uid()) = true
);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);


-- Resume Policies
create policy "Users can manage own resumes" on resumes for all using (auth.uid() = user_id);

-- Job Policies
create policy "Users can manage own jobs" on jobs for all using (auth.uid() = user_id);

-- User Skills Policies
create policy "Users can manage own skills" on user_skills for all using (auth.uid() = user_id);

-- Logs Policies
create policy "Users can insert own logs" on logs for insert with check (auth.uid() = user_id);
create policy "Users can view own logs" on logs for select using (auth.uid() = user_id);

-- Role Models Policies
create policy "Users can manage own role models" on role_models for all using (auth.uid() = user_id);

-- Target Jobs Policies
create policy "Users can manage own target jobs" on target_jobs for all using (auth.uid() = user_id);

-- Feedback Policies
create policy "Users can insert own feedback" on feedback for insert with check (auth.uid() = user_id);

-- Usage Policies
-- Start with strict Admin-only access (Users cannot query their own usage directly)
create policy "Admins can view all usage" on daily_usage for select using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Invite Codes: Only Service Role/Functions can view/edit. No direct public policies.

-- 4. FUNCTIONS & TRIGGERS

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, is_admin, is_tester, inbound_email_token)
  values (new.id, new.email, false, false, substring(md5(random()::text) from 1 for 12));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Secure function to redeem invite codes
create or replace function redeem_invite_code(code_input text)
returns boolean
language plpgsql
language plpgsql
security definer
set search_path = public
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
CREATE INDEX IF NOT EXISTS idx_profiles_usage ON profiles(subscription_tier, job_analyses_count);

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

-- Function to check if user can create a new analysis
CREATE OR REPLACE FUNCTION check_analysis_limit(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_count INT;
  v_today_count INT;
  v_is_admin BOOLEAN;
  v_is_tester BOOLEAN;
BEGIN
  -- Get user details
  SELECT subscription_tier, job_analyses_count, is_admin, is_tester
  INTO v_tier, v_count, v_is_admin, v_is_tester
  FROM profiles
  WHERE id = p_user_id;

  -- Admin/Tester/Pro: High limit (100/day)
  IF v_is_admin OR v_is_tester OR v_tier = 'pro' THEN
    SELECT COUNT(*)
    INTO v_today_count
    FROM jobs
    WHERE user_id = p_user_id
    AND date_added::date = CURRENT_DATE;

    IF v_today_count >= 100 THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'daily_limit_reached',
        'used', v_today_count,
        'limit', 100
      );
    END IF;
    RETURN jsonb_build_object('allowed', true);
  END IF;

  -- Plus: Unlimited (effectively same as pro in this simple check)
  IF v_tier = 'plus' THEN
     RETURN jsonb_build_object('allowed', true);
  END IF;

  -- Free tier: 3 total analyses
  IF v_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'free_limit_reached',
      'used', v_count,
      'limit', 3
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- Function to increment analysis count after successful job creation
CREATE OR REPLACE FUNCTION increment_analysis_count(p_user_id UUID)
RETURNS VOID
LANGUAGE SQL
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET 
    job_analyses_count = job_analyses_count + 1,
    last_analysis_date = NOW()
  WHERE id = p_user_id;
$$;

-- Function to prevent users from updating their own tier/admin status
CREATE OR REPLACE FUNCTION protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the requester is not a superuser/service_role
  -- we prevent changes to these specific columns
  IF (current_setting('role') <> 'service_role') THEN
    NEW.subscription_tier = OLD.subscription_tier;
    NEW.is_admin = OLD.is_admin;
    NEW.is_tester = OLD.is_tester;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the protection trigger
CREATE TRIGGER ensure_tier_integrity
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE protect_sensitive_profile_fields();

-- Function to track daily token usage and total AI calls
create or replace function track_usage(p_tokens int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Daily Usage (Token based)
  insert into daily_usage (user_id, date, request_count, token_count)
  values (auth.uid(), current_date, 1, p_tokens)
  on conflict (user_id, date)
  do update set 
    request_count = daily_usage.request_count + 1,
    token_count = daily_usage.token_count + excluded.token_count;

  -- 2. Profile Cumulative Stats
  update profiles 
  set total_ai_calls = total_ai_calls + 1
  where id = auth.uid();
end;
$$;

-- View to spot token outliers (Users > 3x the average FOR THEIR TIER)
create or replace view usage_outliers with (security_invoker = true) as
with daily_stats as (
  select 
    u.date, 
    p.subscription_tier, 
    avg(u.token_count) as avg_tokens
  from daily_usage u
  join profiles p on u.user_id = p.id
  where u.token_count > 0
  group by u.date, p.subscription_tier
)
select 
  u.user_id, 
  p.email, 
  p.subscription_tier,
  u.date, 
  u.token_count, 
  round(ds.avg_tokens) as tier_average,
  round(u.token_count / nullif(ds.avg_tokens, 0), 1) as x_times_normal
from daily_usage u
join profiles p on u.user_id = p.id
join daily_stats ds on u.date = ds.date and p.subscription_tier = ds.subscription_tier
where u.token_count > (ds.avg_tokens * 3) -- Compare apple-to-apples (User vs User's Tier Avg)
order by x_times_normal desc;

-- 6. INITIAL SEEDING
insert into invite_codes (code, remaining_uses) values ('JOBFIT2024', 9999) on conflict do nothing;

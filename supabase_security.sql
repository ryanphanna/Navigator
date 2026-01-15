-- 1. Invite Codes Table (The "Guest List")
create table invite_codes (
  code text primary key,
  remaining_uses int not null default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Only Service Role (Admin) can view/edit codes. 
-- Users access this ONLY via the secure function 'redeem_invite_code'.
alter table invite_codes enable row level security;

-- 2. Daily Usage Table (The "Scoreboard")
create table daily_usage (
  user_id uuid references auth.users(id) not null,
  date date not null default current_date,
  request_count int not null default 0,
  primary key (user_id, date)
);

-- RLS: Users can read their own usage (for the Progress Bar).
-- Writes are handled by the Edge Function (Service Role).
alter table daily_usage enable row level security;

create policy "Users can view own usage"
  on daily_usage for select
  using (auth.uid() = user_id);

-- 3. Secure Function to Redeem Code (The "Bouncer")
-- This function runs with security-definer privileges to safely check/update the codes table.
create or replace function redeem_invite_code(code_input text)
returns boolean
language plpgsql
security definer
as $$
declare
  valid_code boolean;
begin
  -- Check if code exists, is active, and has uses left
  select exists(
    select 1 from invite_codes 
    where code = code_input 
    and is_active = true 
    and remaining_uses > 0
  ) into valid_code;

  if valid_code then
    -- Decrement use count
    update invite_codes 
    set remaining_uses = remaining_uses - 1 
    where code = code_input;
    return true;
  else
    return false;
  end if;
end;
$$;

-- Seed a default code for the owner
insert into invite_codes (code, remaining_uses) values ('JOBFIT2024', 9999) on conflict do nothing;

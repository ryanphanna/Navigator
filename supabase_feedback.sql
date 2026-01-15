-- 4. Feedback Table (The "Comment Box")
create table feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  job_id text not null, -- can be local ID or whatever
  rating int not null, -- 1 for good, -1 for bad
  context text, -- e.g. "cover_letter" or "resume"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Users can insert their own feedback.
alter table feedback enable row level security;

create policy "Users can insert own feedback"
  on feedback for insert
  with check (auth.uid() = user_id);

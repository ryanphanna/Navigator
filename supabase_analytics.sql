-- 5. Outcome Tracking
-- Add simple text status column. Using text constraint for flexibility but consistency.
alter table jobs 
add column if not exists status text default 'saved' 
check (status in ('saved', 'applied', 'interview', 'offer', 'rejected', 'ghosted'));

-- Create an index for faster analytics later
create index if not exists jobs_status_idx on jobs(status);

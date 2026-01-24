-- Migration: Add is_admin and is_tester columns to profiles table
-- Created: 2026-01-24
-- Purpose: Remove hardcoded admin/tester checks and move to database

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_tester boolean DEFAULT false;

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_tester ON profiles(is_tester) WHERE is_tester = true;

-- Example: Set admin status for the beta owner (update with actual user ID)
-- UPDATE profiles SET is_admin = true WHERE email = 'your-admin-email@example.com';

-- Example: Grant tester/beta access to users
-- UPDATE profiles SET is_tester = true WHERE id IN (
--   SELECT id FROM profiles WHERE created_at < '2026-02-01' -- All early users
-- );

-- Update the handle_new_user function to initialize new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin, is_tester)
  VALUES (new.id, new.email, false, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions (users can still only see their own profile)
-- RLS policies remain unchanged - users can only view/update their own data

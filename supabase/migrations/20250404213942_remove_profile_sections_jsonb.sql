-- Remove the profile_sections JSONB column from profiles table
-- since we've moved to a relational structure with the profile_sections table

ALTER TABLE profiles
DROP COLUMN IF EXISTS profile_sections;

-- Add a comment to document this migration
COMMENT ON TABLE profiles IS 'User profile information with relational sections structure';

-- Add new fields to the profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL;

-- Create an index on the email field for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

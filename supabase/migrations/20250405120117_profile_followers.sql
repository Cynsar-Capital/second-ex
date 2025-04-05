-- Create profile_followers table to track followers
CREATE TABLE IF NOT EXISTS profile_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL,
  follower_email TEXT NOT NULL,
  follower_name TEXT,
  follower_message TEXT,
  is_subscribed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_profile
    FOREIGN KEY (profile_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_followers_profile_id ON profile_followers(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_followers_email ON profile_followers(follower_email);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_followers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_profile_followers_updated_at
BEFORE UPDATE ON profile_followers
FOR EACH ROW
EXECUTE FUNCTION update_profile_followers_updated_at();

-- Enable Row Level Security
ALTER TABLE profile_followers ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_followers
-- Allow anyone to insert (anonymous users can follow profiles)
CREATE POLICY "Anyone can follow a profile"
ON profile_followers
FOR INSERT
TO public
WITH CHECK (true);

-- Allow profile owners to see their followers
CREATE POLICY "Profile owners can view their followers"
ON profile_followers
FOR SELECT
TO authenticated
USING (profile_id IN (
  SELECT id FROM profiles
  WHERE auth.uid() = id
));

-- Allow followers to manage their own follow status (e.g., unsubscribe)
CREATE POLICY "Followers can update their own follow status"
ON profile_followers
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

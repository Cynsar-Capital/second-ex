-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate policies with proper permissions
-- Allow users to view any profile
CREATE POLICY "Anyone can view profiles" 
  ON profiles 
  FOR SELECT 
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Log policy changes for debugging
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for profiles table have been recreated';
END $$;

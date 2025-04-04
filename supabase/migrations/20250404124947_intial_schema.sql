-- Create profiles table that references auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create a trigger to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

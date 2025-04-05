-- Add custom profile sections functionality

-- Add columns to profiles for user-defined sections
ALTER TABLE profiles
ADD COLUMN is_admin BOOLEAN DEFAULT false,
ADD COLUMN profile_sections JSONB DEFAULT '{}'::jsonb;

-- Create a table to track profile section metadata
CREATE TABLE profile_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  section_name TEXT NOT NULL,
  section_order INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  CONSTRAINT unique_profile_section UNIQUE (section_name)
);

-- Enable Row Level Security
ALTER TABLE profile_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_sections
-- Anyone can view public profile sections
CREATE POLICY "Anyone can view public profile sections" 
  ON profile_sections 
  FOR SELECT 
  USING (is_public = true);

-- Users can view all their own profile sections
CREATE POLICY "Users can view all their own profile sections" 
  ON profile_sections 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = profile_id);

-- Users can insert their own profile sections
CREATE POLICY "Users can insert their own profile sections" 
  ON profile_sections 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = profile_id);

-- Users can update their own profile sections
CREATE POLICY "Users can update their own profile sections" 
  ON profile_sections 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = profile_id);

-- Users can delete their own profile sections
CREATE POLICY "Users can delete their own profile sections" 
  ON profile_sections 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = profile_id);

-- Create helper functions for working with profile sections

-- Function to add or update a profile section
CREATE OR REPLACE FUNCTION upsert_profile_section(
  p_profile_id UUID,
  p_section_name TEXT,
  p_section_data JSONB,
  p_is_public BOOLEAN DEFAULT true,
  p_section_order INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  section_id UUID;
  current_order INTEGER;
BEGIN
  -- Get the current max order if order not specified
  IF p_section_order IS NULL THEN
    SELECT COALESCE(MAX(section_order), 0) + 1 INTO current_order 
    FROM profile_sections 
    WHERE profile_id = p_profile_id;
  ELSE
    current_order := p_section_order;
  END IF;
  
  -- Insert or update the section metadata
  INSERT INTO profile_sections (
    profile_id, 
    section_name, 
    section_order, 
    is_public
  ) VALUES (
    p_profile_id, 
    p_section_name, 
    current_order, 
    p_is_public
  )
  ON CONFLICT (profile_id, section_name) DO UPDATE SET
    updated_at = now(),
    section_order = EXCLUDED.section_order,
    is_public = EXCLUDED.is_public
  RETURNING id INTO section_id;
  
  -- Update the profile's sections JSONB
  UPDATE profiles
  SET profile_sections = jsonb_set(
    COALESCE(profile_sections, '{}'::jsonb),
    ARRAY[p_section_name],
    p_section_data
  )
  WHERE id = p_profile_id;
  
  RETURN section_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a profile section
CREATE OR REPLACE FUNCTION remove_profile_section(
  p_profile_id UUID,
  p_section_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Delete the section metadata
  DELETE FROM profile_sections
  WHERE profile_id = p_profile_id AND section_name = p_section_name;
  
  -- Remove the section from the profile's sections JSONB
  UPDATE profiles
  SET profile_sections = profile_sections - p_section_name
  WHERE id = p_profile_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a profile with all its sections
CREATE OR REPLACE FUNCTION get_profile_with_sections(p_profile_id UUID, p_include_private BOOLEAN DEFAULT false)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  sections JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.website,
    p.bio,
    jsonb_object_agg(
      ps.section_name,
      jsonb_build_object(
        'data', p.profile_sections->ps.section_name,
        'metadata', jsonb_build_object(
          'id', ps.id,
          'created_at', ps.created_at,
          'updated_at', ps.updated_at,
          'order', ps.section_order,
          'is_public', ps.is_public
        )
      )
    ) AS sections
  FROM 
    profiles p
    LEFT JOIN profile_sections ps ON p.id = ps.profile_id
  WHERE 
    p.id = p_profile_id
    AND (p_include_private OR ps.is_public OR p.id = auth.uid())
  GROUP BY 
    p.id, p.username, p.full_name, p.avatar_url, p.website, p.bio;
END;
$$ LANGUAGE plpgsql;

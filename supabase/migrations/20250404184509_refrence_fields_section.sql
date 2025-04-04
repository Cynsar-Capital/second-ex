-- Ensure we have the necessary columns in profile_sections table
ALTER TABLE profile_sections
ADD COLUMN IF NOT EXISTS section_key TEXT,
ADD COLUMN IF NOT EXISTS title TEXT;

-- Make sure we have the right column for ordering
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_sections' AND column_name = 'display_order') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_sections' AND column_name = 'section_order') THEN
      ALTER TABLE profile_sections RENAME COLUMN section_order TO display_order;
    ELSE
      ALTER TABLE profile_sections ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Create profile_section_fields table for storing section fields
CREATE TABLE IF NOT EXISTS profile_section_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT NOT NULL DEFAULT 'text',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_section
    FOREIGN KEY (section_id)
    REFERENCES profile_sections(id)
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_sections_profile_id ON profile_sections(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_section_fields_section_id ON profile_section_fields(section_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_profile_sections_updated_at
BEFORE UPDATE ON profile_sections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_section_fields_updated_at
BEFORE UPDATE ON profile_section_fields
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for security
ALTER TABLE profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_section_fields ENABLE ROW LEVEL SECURITY;

-- Policy for profile_sections - users can only see their own sections
CREATE POLICY "Users can view their own profile sections"
ON profile_sections
FOR SELECT
USING (
  auth.uid() = (SELECT id FROM profiles WHERE id = profile_id)
);



-- Similar policies for profile_section_fields
CREATE POLICY "Users can view their own profile section fields"
ON profile_section_fields
FOR SELECT
USING (
  auth.uid() = (SELECT id FROM profiles WHERE id = (SELECT profile_id FROM profile_sections WHERE id = section_id))
);

CREATE POLICY "Users can update their own profile section fields"
ON profile_section_fields
FOR UPDATE
USING (auth.uid() = (SELECT id FROM profiles WHERE id = (SELECT profile_id FROM profile_sections WHERE id = section_id)));

CREATE POLICY "Users can insert their own profile section fields"
ON profile_section_fields
FOR INSERT
WITH CHECK (auth.uid() = (SELECT id FROM profiles WHERE id = (SELECT profile_id FROM profile_sections WHERE id = section_id)));

CREATE POLICY "Users can delete their own profile section fields"
ON profile_section_fields
FOR DELETE
USING (auth.uid() = (SELECT id FROM profiles WHERE id = (SELECT profile_id FROM profile_sections WHERE id = section_id)));

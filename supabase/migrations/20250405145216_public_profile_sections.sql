-- Add public access policies for profile sections and fields
-- This allows non-logged-in users to view profile sections and their fields

-- Policy for profile_sections - public users can view any profile section
CREATE POLICY "Public users can view any profile section"
ON profile_sections
FOR SELECT
USING (true);

-- Policy for profile_section_fields - public users can view any profile section field
CREATE POLICY "Public users can view any profile section field"
ON profile_section_fields
FOR SELECT
USING (true);

-- Add comment to document this migration
COMMENT ON TABLE profile_sections IS 'Profile sections with public read access';
COMMENT ON TABLE profile_section_fields IS 'Profile section fields with public read access';

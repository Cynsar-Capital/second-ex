-- Create profile_recommendations table
CREATE TABLE IF NOT EXISTS profile_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recommender_name TEXT NOT NULL,
  recommender_email TEXT NOT NULL,
  recommender_avatar TEXT,
  recommendation_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for profile_recommendations
ALTER TABLE profile_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Public users can view only approved and public recommendations
CREATE POLICY "Public users can view approved recommendations" 
  ON profile_recommendations 
  FOR SELECT 
  USING (status = 'approved' AND is_public = TRUE);

-- Policy: Users can view all recommendations for their own profile
CREATE POLICY "Users can view all recommendations for their profile" 
  ON profile_recommendations 
  FOR SELECT 
  USING (auth.uid() = profile_id);

-- Policy: Users can view recommendations they've made
CREATE POLICY "Users can view recommendations they've made" 
  ON profile_recommendations 
  FOR SELECT 
  USING (auth.uid() = recommender_id);

-- Policy: Anyone can create a recommendation
CREATE POLICY "Anyone can create a recommendation" 
  ON profile_recommendations 
  FOR INSERT 
  WITH CHECK (TRUE);

-- Policy: Profile owners can update recommendation status
CREATE POLICY "Profile owners can update recommendation status" 
  ON profile_recommendations 
  FOR UPDATE 
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Policy: Recommenders can update their own recommendations if still pending
CREATE POLICY "Recommenders can update their own recommendations if pending" 
  ON profile_recommendations 
  FOR UPDATE 
  USING (auth.uid() = recommender_id AND status = 'pending')
  WITH CHECK (auth.uid() = recommender_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on profile_recommendations
CREATE TRIGGER update_profile_recommendations_updated_at
BEFORE UPDATE ON profile_recommendations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate status transitions
CREATE OR REPLACE FUNCTION validate_recommendation_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow specific status transitions
  IF OLD.status = 'pending' AND (NEW.status = 'approved' OR NEW.status = 'rejected') THEN
    RETURN NEW;
  ELSIF OLD.status = 'rejected' AND NEW.status = 'approved' THEN
    RETURN NEW;
  ELSIF OLD.status = NEW.status THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce valid status transitions
CREATE TRIGGER validate_recommendation_status_transition
BEFORE UPDATE OF status ON profile_recommendations
FOR EACH ROW
EXECUTE FUNCTION validate_recommendation_status_transition();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS profile_recommendations_profile_id_idx ON profile_recommendations(profile_id);
CREATE INDEX IF NOT EXISTS profile_recommendations_recommender_id_idx ON profile_recommendations(recommender_id);
CREATE INDEX IF NOT EXISTS profile_recommendations_status_idx ON profile_recommendations(status);

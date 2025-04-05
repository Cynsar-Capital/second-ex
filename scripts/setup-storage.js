// One-time script to set up Supabase storage buckets
// Run with: node scripts/setup-storage.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('Setting up Supabase storage buckets...');
  
  try {
    // Create profile-images bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const profileBucketExists = buckets.some(bucket => bucket.name === 'profile-images');
    
    if (!profileBucketExists) {
      console.log('Creating profile-images bucket...');
      const { error } = await supabase.storage.createBucket('profile-images', {
        public: true, // Make the bucket publicly accessible
        fileSizeLimit: 1024 * 1024 * 2, // 2MB file size limit
      });
      
      if (error) {
        console.error('Error creating profile-images bucket:', error);
      } else {
        console.log('Created profile-images bucket successfully');
      }
    } else {
      console.log('profile-images bucket already exists');
    }
    
    console.log('\nIMPORTANT: Make sure to set up RLS policies in the Supabase dashboard:');
    console.log('1. Go to Storage > Policies in the Supabase dashboard');
    console.log('2. For the profile-images bucket, add policies to allow authenticated users to:');
    console.log('   - SELECT: Allow users to view images');
    console.log('   - INSERT: Allow users to upload images');
    console.log('   - UPDATE: Allow users to update their own images');
    console.log('   - DELETE: Allow users to delete their own images');
    
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

setupStorage();

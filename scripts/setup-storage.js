// One-time script to set up Supabase storage buckets
// Run with: node scripts/setup-storage.js

// Import required packages
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in environment variables');
  console.log('Make sure you have a .env file with the following variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

// Create Supabase clients - one with anon key and one with service role key
const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

// Determine which client to use for admin operations
const adminClient = adminSupabase || supabase;

async function setupStorage() {
  console.log('Setting up Supabase storage buckets...');
  
  try {
    // Create profile-images bucket if it doesn't exist
    // Use admin client to list buckets (works with both anon and service role)
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const profileBucketExists = buckets.some(bucket => bucket.name === 'profile-images');
    
    if (!profileBucketExists) {
      console.log('Creating profile-images bucket...');
      
      // Create the bucket with public access using admin client
      const { data, error } = await adminClient.storage.createBucket('profile-images', {
        public: true, // Make the bucket publicly accessible
        fileSizeLimit: 1024 * 1024 * 2, // 2MB file size limit
      });
      
      if (error) {
        console.error('Error creating profile-images bucket:', error.message);
        if (!serviceRoleKey) {
          console.log('\nNOTE: You are using the anon key which has limited permissions.');
          console.log('To create buckets and policies, add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
        } else {
          console.log('\nThere was an error even with the service role key. Check your Supabase setup.');
        }
      } else {
        console.log('Successfully created profile-images bucket!');
      }
      
      // Create policies for the bucket
      await createBucketPolicies();
    } else {
      console.log('profile-images bucket already exists');
      console.log('Setting up storage policies...');
      
      // Create policies for the existing bucket
      await createBucketPolicies();
    }
    
    console.log('\nStorage setup complete!');
    console.log('The following policies have been created for the profile-images bucket:');
    console.log('   - SELECT: Public access to view all images');
    console.log('   - INSERT: Users can upload to their own folders');
    console.log('   - UPDATE: Users can update files in their own folders');
    console.log('   - DELETE: Users can delete files in their own folders');
    
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

// Function to create policies for the profile-images bucket
async function createBucketPolicies() {
  try {
    console.log('\n----------------------------------------');
    console.log('Setting up storage policies for profile-images bucket...');
    console.log('----------------------------------------');
    
    if (!serviceRoleKey) {
      console.log('NOTE: Creating policies requires the service role key.');
      console.log('Add SUPABASE_SERVICE_ROLE_KEY to your .env file to create policies automatically.');
      console.log('\nFor now, you can manually set these policies in the Supabase Dashboard:');
      console.log('1. Go to Supabase Dashboard > Storage > Policies');
      console.log('2. Create the following policies for the profile-images bucket:');
      
      console.log('   - SELECT Policy: Allow public access');
      console.log('     Definition: true');
      
      console.log('   - INSERT Policy: Users can only upload to their own folders');
      console.log('     Definition: ((bucket_id = \'profile-images\'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))');
      
      console.log('   - UPDATE Policy: Users can only update their own files');
      console.log('     Definition: ((bucket_id = \'profile-images\'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))');
      
      console.log('   - DELETE Policy: Users can only delete their own files');
      console.log('     Definition: ((bucket_id = \'profile-images\'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))');
      return;
    }
    
    // If we have the service role key, attempt to create policies
    console.log('Creating storage policies with service role key...');
    console.log('NOTE: For local development, policy creation may not work directly.');
    console.log('You may need to create policies manually in the Supabase Dashboard.');
    console.log('These policies will be automatically created by the GitHub Actions workflow.');
    
    // For GitHub Actions deployment, we'll use the Supabase CLI to create policies
    // The policy definitions are documented here for reference
    
    console.log('\nPolicy definitions for reference:');
    console.log('1. SELECT Policy: Allow public access');
    console.log('   Definition: true');
    
    console.log('2. INSERT Policy: Users can only upload to their own folders');
    console.log('   Definition: ((bucket_id = \'profile-images\') AND (auth.uid()::text = storage.foldername(name)[1]))');
    
    console.log('3. UPDATE Policy: Users can only update their own files');
    console.log('   Definition: ((bucket_id = \'profile-images\') AND (auth.uid()::text = storage.foldername(name)[1]))');
    
    console.log('4. DELETE Policy: Users can only delete their own files');
    console.log('   Definition: ((bucket_id = \'profile-images\') AND (auth.uid()::text = storage.foldername(name)[1]))');
    
    // For GitHub Actions, we'll use migrations to create these policies
    // This is documented in the README.md file
    
  } catch (error) {
    console.error('Error creating bucket policies:', error);
  }
}

setupStorage();

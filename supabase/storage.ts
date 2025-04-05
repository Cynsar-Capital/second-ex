import { supabase } from './utils';
import { v4 as uuidv4 } from 'uuid';

// Note: Buckets should be pre-created in the Supabase dashboard
// with appropriate RLS policies for authenticated users

/**
 * Upload an image to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param folder The folder path within the bucket
 * @returns The public URL of the uploaded file
 */
export const uploadImage = async (
  file: File,
  bucket: string = 'profile-images',
  folder: string = 'avatars'
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be authenticated to upload images');
    }

    // Note: Make sure the bucket 'profile-images' is pre-created in the Supabase dashboard
    // with appropriate RLS policies for authenticated users
    console.log(`Using pre-created bucket: ${bucket}`);
    
    // If you're getting 'bucket not found' errors, create the bucket in the Supabase dashboard
    // or uncomment and run this code once during app initialization:
    /*
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
    });
    */

    // Create a unique filename with user ID prefix to ensure proper ownership
    const fileExt = file.name.split('.').pop();
    const userId = session.user.id;
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${folder}/${fileName}`;

    console.log('Uploading file to path:', filePath);

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { url: null, error: error as Error };
  }
};

/**
 * Delete an image from Supabase Storage
 * @param url The public URL of the image to delete
 * @param bucket The storage bucket name
 * @returns Success status
 */
export const deleteImage = async (
  url: string,
  bucket: string = 'profile-images'
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    if (!url) {
      return { success: true, error: null }; // Nothing to delete
    }

    // Extract the file path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');

    // Delete the file
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error as Error };
  }
};

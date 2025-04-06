import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';

import { toast } from '@medusajs/ui';
import { supabase } from '@/supabase/utils';


// Define a type for profile data
type ProfileData = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  background_url?: string;
  website?: string;
  bio?: string;
  email?: string;
  profile_sections?: Record<string, any>;
  custom_fields?: Record<string, any>;
  [key: string]: any;
};

// Define profile query keys
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
};

// Fetch a profile by ID
export const fetchProfileById = async (id: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }

  return data;
};

// Fetch a profile by username
export const fetchProfileByUsername = async (username: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching profile by username:', error);
    throw error;
  }

  return data;
};

// Hook to fetch profile by ID
export const useProfile = (id: string | undefined) => {
  return useQuery<ProfileData | null, Error>({
    queryKey: id ? profileKeys.detail(id) : ['profiles', 'empty'],
    queryFn: () => id ? fetchProfileById(id) : Promise.resolve(null),
    enabled: !!id,
  });
};

// Hook to fetch profile by username
export const useProfileByUsername = (username: string | undefined) => {
  return useQuery<ProfileData | null, Error>({
    queryKey: username ? ['profiles', 'username', username] : ['profiles', 'empty'],
    queryFn: () => username ? fetchProfileByUsername(username) : Promise.resolve(null),
    enabled: !!username,
  });
};

// Hook to update profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      console.log('Updating profile with ID:', id);
      console.log('Update data:', JSON.stringify(data, null, 2));
      
      if (!id) {
        const error = new Error('Profile ID is required for update');
        console.error(error);
        throw error;
      }
      
      // First fetch the current profile to ensure it exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        throw fetchError;
      }
      
      if (!existingProfile) {
        const error = new Error(`Profile with ID ${id} not found`);
        console.error(error);
        throw error;
      }
      
      console.log('Found existing profile:', existingProfile.id);
      
      // Ensure we're explicitly handling empty values
      // This is important for fields like bio that might be set to empty string
      console.log('Preparing data for update, ensuring empty values are preserved');
      console.log(data)
      // Perform the update and get the updated data in one operation
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          ...data,
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log('Profile updated successfully');
      console.log('Updated profile data:', updatedProfile);
      
      // If no rows returned, use the existing profile with the updates applied
      if (!updatedProfile || updatedProfile.length === 0) {
        console.log('No rows returned from update, using merged data');
        
        // Create a new object with the updates applied
        // This ensures that empty strings and null values in the update data
        // will override the existing values
        const mergedData = { ...existingProfile };
        
        // Explicitly apply each property from the update data
        for (const key in data) {
          // Even if the value is empty string or null, we want to apply it
          mergedData[key] = data[key];
        }
        
        console.log('Merged data with empty values preserved:', mergedData);
        return mergedData;
      }
      
      // Return the first row of the updated data
      return updatedProfile[0];
    },
    onSuccess: (data) => {
      console.log('Update successful, invalidating queries for ID:', data.id);
      
      if (!data.id) {
        console.error('No ID in returned data, cannot invalidate queries');
        return;
      }
      
      // Invalidate all profile queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
      
      // Force refetch the specific profile
      queryClient.refetchQueries({
        queryKey: profileKeys.detail(data.id),
        exact: false,
        type: 'active',
      });
      
      // If username is present, also refetch username-based queries
      if (data.username) {
        queryClient.refetchQueries({
          queryKey: ['profiles', 'username', data.username],
          exact: false,
          type: 'active',
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to update profile', {
        description: error.message || 'Please try again later',
      });
    },
  });
};

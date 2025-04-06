"use client";

import { useState } from 'react';
import { toast } from "@medusajs/ui";
import { useUpdateProfile } from './use-profile';
import { getCurrentUser } from '@/supabase/utils';
import { ProfileData } from '@/types/profile';

interface UseProfileUpdateOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useProfileUpdate(options: UseProfileUpdateOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateProfileMutation = useUpdateProfile();
  
  const updateProfile = async (
    profile: ProfileData | undefined, 
    modalType: string | null, 
    data: any, 
    workItemIndex?: number,
    sectionKey?: string | null
  ) => {
    if (!profile) {
      console.error('No profile data available');
      return;
    }
    
    setIsSubmitting(true);
    // Show a loading toast while processing
    const loadingToast = toast.loading("Processing your changes...");
    
    console.log('Starting profile update:', {
      profileId: profile.id,
      modalType,
      workItemIndex,
      sectionKey
    });
    
    // Refresh user data before proceeding
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        console.error('User not authenticated');
        toast.dismiss(loadingToast);
        toast.error("Authentication required", {
          description: "You must be logged in to update your profile.",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Verify the user has permission to update this profile
      if (user.id !== profile.id) {
        console.error('User does not have permission to update this profile');
        toast.dismiss(loadingToast);
        toast.error("Permission denied", {
          description: "You can only update your own profile.",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Prepare update data based on modal type
      let updateData: any = {};
      
      if (modalType === 'profile') {
        // Update basic profile information - explicitly handle empty strings
        updateData = {
          full_name: data.name !== undefined ? data.name : '',
          website: data.website !== undefined ? data.website : '',
          email: data.email !== undefined ? data.email : '',
          avatar_url: data.avatar_url !== undefined ? data.avatar_url : null,
          background_url: data.background_url !== undefined ? data.background_url : null
        };
        console.log('Profile update data:', updateData);
      } else if (modalType === 'bio') {
        // Update bio only - explicitly handle empty strings
        updateData = {
          bio: data.bio !== undefined ? data.bio : ''
        };
        console.log('Bio update data:', updateData);
      } else if (modalType === 'work') {
        // Update work experience
        const profileSections = profile.profile_sections || {};
        updateData = {
          profile_sections: {
            ...profileSections,
            work: data.work || []
          }
        };
      } else if (modalType === 'work-item' && workItemIndex !== undefined) {
        // Update a specific work item
        const workItems = profile.profile_sections?.work || [];
        const updatedWorkItems = [...workItems];
        
        if (workItemIndex < updatedWorkItems.length) {
          updatedWorkItems[workItemIndex] = data;
        } else {
          updatedWorkItems.push(data);
        }
        
        const profileSections = profile.profile_sections || {};
        updateData = {
          profile_sections: {
            ...profileSections,
            work: updatedWorkItems
          }
        };
      } else if (modalType === 'sections') {
        // Update all profile sections
        updateData = {
          profile_sections: data
        };
      } else if (modalType === 'section-edit') {
        if (!sectionKey) {
          throw new Error('Section key is required for section-edit');
        }
        
        console.log('Section edit data received:', data);
        console.log('Data structure check:',
          'fields' in data ? 'has fields array directly' : 'no direct fields',
          'section_id' in data ? 'has section_id' : 'no section_id',
          'title' in data ? 'has title' : 'no title'
        );
        
        // Make sure we have the current profile sections - initialize if needed
        const profileSections = profile.profile_sections || {};
        
        // Handle both data structures - either direct section data or nested in sectionData
        // Check if data has fields directly (new structure)
        const isDirectSectionData = 'fields' in data && Array.isArray(data.fields);
        
        // Determine where to get the data from
        const sectionData = isDirectSectionData ? data : (data.sectionData || {});
        console.log('Using section data:', sectionData);
        
        // Check if we have any data to work with
        if (!sectionData || (typeof sectionData !== 'object')) {
          console.error('Invalid section data format provided for update');
          throw new Error('Invalid section data format for section update');
        }
        
        // Create a deep copy of the existing section data if it exists
        const existingSectionData = profileSections[sectionKey] ? 
          JSON.parse(JSON.stringify(profileSections[sectionKey])) : {};
          
        console.log('Existing section data:', existingSectionData || 'undefined');
        
        // Check if existingSectionData exists before merging
        const existingFields = existingSectionData?.fields || [];
        
        // Check if the section data has fields
        const newFields = sectionData.fields;
        const useNewFields = Array.isArray(newFields);
        
        console.log('Using new fields:', useNewFields, 'New fields count:', useNewFields ? newFields.length : '0');
        
        // Ensure a section ID is preserved
        const sectionId = sectionData.section_id || existingSectionData.section_id;
        
        // Merge the existing section data with the new data
        const mergedSectionData = {
          ...(existingSectionData || {}),
          ...sectionData,
          // Set the section_id if available
          section_id: sectionId,
          // Ensure fields are properly handled - if new fields are provided use those, otherwise keep existing
          fields: useNewFields ? newFields : existingFields
        };
        
        console.log('Merged section data:', mergedSectionData);
        
        // Ensure we're not losing any fields
        if (!mergedSectionData.fields) {
          console.warn('No fields in merged data, using empty array as fallback');
          mergedSectionData.fields = [];
        }
        
        updateData = {
          profile_sections: {
            ...profileSections,
            [sectionKey]: mergedSectionData
          }
        };
        
        // Debug profile_sections
        console.log('Updated profile_sections structure:', updateData);
      }
      
      // Log what we're about to update
      console.log('Updating profile with ID:', profile.id);
      console.log('Update data being sent:', JSON.stringify(updateData, null, 2));
      
      // Use TanStack Query mutation to update the profile
      const result = await updateProfileMutation.mutateAsync({
        id: profile.id,
        data: updateData
      });
      
      console.log('Update result:', result);
      
      // Verify the update was successful by checking the result
      if (!result) {
        throw new Error('Profile update failed: No result returned');
      }
      
      console.log('Update successful');
      
      // Dismiss the loading toast
      toast.dismiss(loadingToast);
      
      // Show success toast based on modal type
      if (modalType === 'section-edit') {
        toast.success("Section saved", {
          description: "Your profile section has been updated.",
        });
      } else if (modalType === 'profile') {
        toast.success("Profile saved", {
          description: "Your profile information has been updated.",
        });
      } else if (modalType === 'bio') {
        toast.success("Bio saved", {
          description: "Your bio has been updated successfully.",
        });
      } else {
        toast.success("Changes saved", {
          description: "Your changes have been saved successfully.",
        });
      }
      
      // TanStack Query will automatically update the UI with the latest data
      // No need for manual window refresh functions
      
      // Call onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Dismiss the loading toast
      toast.dismiss(loadingToast);
      
      // Show error toast
      toast.error("Update failed", {
        description: "There was a problem updating your profile. Please try again.",
      });
      
      // Call onError callback if provided
      if (options.onError) {
        options.onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    updateProfile,
    isSubmitting
  };
}

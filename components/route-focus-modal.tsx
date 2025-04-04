"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { FocusModal, Button } from "@medusajs/ui";
import { useState, useEffect } from 'react';
import { ProfileData, WorkExperience } from '@/types/profile';
import { ProfileEditForms } from './profile-edit-forms';
import { ProfileSectionEditor } from './profile-section-editor';
import { supabase, getCurrentUser } from '@/supabase/utils';

interface RouteFocusModalProps {
  profile?: ProfileData;
}

export function RouteFocusModal({ profile }: RouteFocusModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modalType = searchParams.get('type') as 'profile' | 'bio' | 'work' | 'work-item' | 'sections' | null;
  const workItemIndex = searchParams.get('index') ? parseInt(searchParams.get('index')!) : undefined;
  // We'll use the session from Supabase directly
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Fetch current user on component mount
  useEffect(() => {
    async function fetchUser() {
      const { user } = await getCurrentUser();
      setCurrentUser(user);
      console.log('Current user for auth:', user?.id);
    }
    fetchUser();
  }, []);
  
  console.log('Supabase client initialized:', !!supabase);
  
  // State for form data
  const [isOpen, setIsOpen] = useState(false);
  
  // Set modal open state based on URL parameters
  useEffect(() => {
    setIsOpen(!!modalType);
  }, [modalType]);
  
  // Close modal and navigate back
  const handleClose = () => {
    // Use push with the current path but without query parameters
    // Check if we're on a subdomain (username.2nd.exchange or username.localhost)
    const hostname = window.location.hostname;
    const isSubdomain = hostname.includes('.') && !hostname.startsWith('www.');
    
    console.log('Closing modal, isSubdomain:', isSubdomain);
    
    // If we're on a subdomain, stay on the same page without query params
    if (isSubdomain) {
      router.push(window.location.pathname);
    } else {
      router.push('/profile');
    }
  };
  
  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    console.log('Handling form submission in RouteFocusModal:', data);
    if (!profile) {
      console.error('No profile data available');
      return;
    }
    
    // Refresh user data before proceeding
    const { user } = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      alert('You must be logged in to update your profile');
      return;
    }
    
    // Update current user state
    setCurrentUser(user);
    
    try {
      // Determine what to update based on modalType
      switch (modalType) {
        case 'sections':
          console.log('Updating custom sections');
          console.log('Current sections:', profile.profile_sections);
          console.log('New section data:', data);
          
          // Handle sections update
          const { data: sectionUpdateData, error: sectionError } = await supabase
            .from('profiles')
            .update({
              profile_sections: {
                ...profile.profile_sections,
                ...data // The data here is already formatted correctly by the ProfileSectionEditor
              }
            })
            .eq('id', profile.id);
            
          if (sectionError) {
            console.error('Error updating profile sections:', sectionError);
            throw sectionError;
          }
          
          console.log('Profile sections updated successfully');
          break;
        case 'profile':
          console.log('Updating profile information');
          console.log('Profile ID for update:', profile.id);
          // Make sure we're updating the authenticated user's profile
          if (!currentUser || currentUser.id !== profile.id) {
            console.error('Not authorized to update this profile');
            throw new Error('Not authorized to update this profile');
          }
          
          console.log('About to update profile with data:', {
            full_name: data.name,
            email: data.email,
            website: data.website
          });
          
          // Verify the current user is authenticated
          if (!currentUser) {
            console.error('No active user found');
            throw new Error('No active user found');
          }
          
          console.log('Active user found:', currentUser.id);
          
          // Now perform the update
          const { data: updateData, error } = await supabase
            .from('profiles')
            .update({
              full_name: data.name,
              email: data.email,
              website: data.website
            })
            .eq('id', profile.id);
          
          if (error) {
            console.error('Error updating profile:', error);
            throw error;
          }
          
          console.log('Profile update result:', updateData);
          break;
          
        case 'bio':
          console.log('Updating bio information');
          console.log('Updating bio for profile ID:', profile.id);
          // Make sure we're updating the authenticated user's profile
          if (!currentUser || currentUser.id !== profile.id) {
            console.error('Not authorized to update this profile');
            throw new Error('Not authorized to update this profile');
          }
          
          const { data: bioUpdateData, error: bioError } = await supabase
            .from('profiles')
            .update({
              bio: data.bio
            })
            .eq('id', profile.id);
          
          if (bioError) {
            console.error('Error updating bio:', bioError);
            throw bioError;
          }
          
          console.log('Bio update result:', bioUpdateData);
          break;
          
        case 'work-item':
          console.log('Updating work experience', workItemIndex);
          // Get current work experience array
          const workItems = [...(profile.profile_sections?.work || profile.custom_fields?.work || [])];
          
          if (workItemIndex !== undefined) {
            // Update existing work item
            workItems[workItemIndex] = data as WorkExperience;
          } else {
            // Add new work item
            workItems.push(data as WorkExperience);
          }
          
          // Update profile with new work items
          console.log('Updating work items for profile ID:', profile.id);
          // Make sure we're updating the authenticated user's profile
          if (!currentUser || currentUser.id !== profile.id) {
            console.error('Not authorized to update this profile');
            throw new Error('Not authorized to update this profile');
          }
          
          const { data: workUpdateData, error: workError } = await supabase
            .from('profiles')
            .update({
              profile_sections: {
                ...profile.profile_sections,
                work: workItems
              }
            })
            .eq('id', profile.id);
          
          if (workError) {
            console.error('Error updating work items:', workError);
            throw workError;
          }
          
          console.log('Work items update result:', workUpdateData);
          break;
      }
      
      console.log('Update successful, closing modal');
      
      // Fetch the updated profile to verify the changes were saved
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
      } else {
        console.log('Updated profile data:', updatedProfile);
      }
      
      // Close modal after successful update
      handleClose();
      
      // Use the global refresh function to update the profile view
      // This will trigger a re-fetch of the profile data without a page reload
      try {
        // @ts-ignore
        if (window.refreshProfileData && typeof window.refreshProfileData === 'function') {
          // @ts-ignore
          window.refreshProfileData();
          console.log('Profile view refreshed via global function');
        } else {
          // Fallback to URL-based refresh
          const timestamp = Date.now();
          const currentPath = window.location.pathname;
          
          // Check if we're on a subdomain (username.2nd.exchange or username.localhost)
          const hostname = window.location.hostname;
          const isSubdomain = hostname.includes('.') && !hostname.startsWith('www.');
          
          if (isSubdomain) {
            router.push(`${currentPath}?refresh=${timestamp}`);
          } else {
            router.push(`/profile?refresh=${timestamp}`);
          }
          console.log('Profile view refreshed via URL change, isSubdomain:', isSubdomain);
        }
      } catch (refreshError) {
        console.error('Error refreshing profile view:', refreshError);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Still close the modal even if there's an error
      handleClose();
    }
  };
  
  // If no profile or modal type, don't render anything
  if (!profile || !modalType) return null;
  
  // Extract profile data for the form
  const userData = {
    name: profile?.full_name || "",
    email: profile?.email || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
    work: (profile?.profile_sections?.work || profile?.custom_fields?.work || []) as WorkExperience[]
  };
  
  // Render the FocusModal with appropriate content based on modal type
  return (
    <FocusModal open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      {modalType === 'sections' ? (
        <FocusModal.Content style={{ zIndex: 50, display: 'flex', flexDirection: 'column', height: '90vh' }}>
          <FocusModal.Header>
            <h2 className="text-xl font-semibold">Customize Profile Sections</h2>
          </FocusModal.Header>
          <FocusModal.Body className="flex-1 overflow-y-auto p-4">
            <ProfileSectionEditor
              profileId={profile.id}
              initialSections={profile.profile_sections || {}}
              onSave={handleFormSubmit}
            />
          </FocusModal.Body>
          <FocusModal.Footer className="border-t border-gray-200 p-4">
            <div className="flex justify-between w-full">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button form="profile-sections-form" type="submit">Save Changes</Button>
            </div>
          </FocusModal.Footer>
        </FocusModal.Content>
      ) : (
        <FocusModal.Content>
          <ProfileEditForms
            open={isOpen}
            onClose={handleClose}
            onSubmit={handleFormSubmit}
            formType={modalType}
            initialData={{
              name: userData.name,
              email: userData.email,
              website: userData.website,
              bio: userData.bio,
              ...(workItemIndex !== undefined && modalType === "work-item" ? userData.work[workItemIndex] : {})
            }}
            workItemIndex={workItemIndex}
          />
        </FocusModal.Content>
      )}
    </FocusModal>
  );
}

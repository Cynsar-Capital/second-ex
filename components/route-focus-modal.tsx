"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { FocusModal, Text, Button, toast, Textarea, Input, Label, Select, Alert } from "@medusajs/ui";
import { useState, useEffect } from 'react';
import { ProfileData, WorkExperience } from '@/types/profile';
import { ProfileEditForms } from './profile-edit-forms';
import { ProfileSectionEditor } from './profile-section-editor';
import { supabase, getCurrentUser } from '@/supabase/utils';
import { FollowerModal } from './follower-modal';

interface RouteFocusModalProps {
  profile?: ProfileData;
}

export function RouteFocusModal({ profile }: RouteFocusModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modalType = searchParams.get('type') as 'profile' | 'bio' | 'work' | 'work-item' | 'sections' | 'section-edit' | 'follow' | null;
  const workItemIndex = searchParams.get('index') ? parseInt(searchParams.get('index')!) : undefined;
  // We'll use the session from Supabase directly
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Fetch current user on component mount
  useEffect(() => {
    async function fetchUser() {
      const { user } = await getCurrentUser();
      setCurrentUser(user);
    }
    fetchUser();
  }, []);
  
  // State for form data
  const [isOpen, setIsOpen] = useState(false);
  
  // State for follower modal
  const [showFollowerModal, setShowFollowerModal] = useState(false);
  
  // Set modal open state based on URL parameters
  useEffect(() => {
    setIsOpen(!!modalType);
    if (modalType === 'follow') {
      setShowFollowerModal(true);
    } else {
      setShowFollowerModal(false);
    }
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

        case 'section-edit':
          console.log('Updating individual section');
          // The data structure now comes from the ProfileEditForms component in a new format
          console.log('Section update data received:', data);
          
          if (!data.section_key) {
            console.error('No section key provided for section-edit');
            throw new Error('No section key provided for section-edit');
          }
          
          // Make sure we're updating the authenticated user's profile
          if (!currentUser || currentUser.id !== profile.id) {
            console.error('Not authorized to update this profile');
            throw new Error('Not authorized to update this profile');
          }
          
          try {
            // First update the section title in the profile_sections table
            if (data.section_id) {
              // If we have a section ID, update the existing section
              console.log('Updating existing section:', data.section_id);
              
              const { data: sectionUpdateData, error: sectionUpdateError } = await supabase
                .from('profile_sections')
                .update({
                  title: data.title
                })
                .eq('id', data.section_id)
                .eq('profile_id', profile.id);
              
              if (sectionUpdateError) throw sectionUpdateError;
              
              // Now handle the fields - first delete existing fields for this section
              const { error: deleteFieldsError } = await supabase
                .from('profile_section_fields')
                .delete()
                .eq('section_id', data.section_id);
              
              if (deleteFieldsError) throw deleteFieldsError;
              
              // Then insert the new fields
              if (data.fields && data.fields.length > 0) {
                console.log('Fields to process:', data.fields);
                
                const fieldsToInsert = data.fields.map((field: any, index: number) => {
                  console.log('Processing field:', field);
                  return {
                    section_id: data.section_id,
                    field_key: field.field_key || `field_${index}`,
                    field_label: field.field_label || field.label || `Field ${index + 1}`,
                    field_value: field.field_value || field.value || '',
                    field_type: field.field_type || field.type || 'text',
                    display_order: index
                  };
                });
                
                console.log('Fields to insert:', fieldsToInsert);
                
                const { data: insertedFields, error: insertFieldsError } = await supabase
                  .from('profile_section_fields')
                  .insert(fieldsToInsert);
                
                if (insertFieldsError) {
                  console.error('Error inserting fields:', insertFieldsError);
                  throw insertFieldsError;
                }
                
                console.log('Inserted new fields:', insertedFields);
              }
            } else {
              // If no section ID, we need to create a new section
              console.error('No section ID provided, cannot update section');
              throw new Error('No section ID provided, cannot update section');
            }
            
            console.log('Section updated successfully');
          } catch (err) {
            console.error('Error updating section:', err);
            throw err;
          }
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
              website: data.website,
              avatar_url: data.avatar_url,
              background_url: data.background_url
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
      
      console.log('Update successful');
      
      // Show success toast based on modal type
      if (modalType === 'section-edit') {
        toast.success("Section saved", {
          description: "Your profile section has been updated.",
        });
      } else if (modalType === 'profile') {
        toast.success("Profile saved", {
          description: "Your profile information has been updated.",
        });
      } else {
        toast.success("Changes saved", {
          description: "Your changes have been saved successfully.",
        });
      }
      
      try {
        // Explicitly refresh the profile data
        // First, directly fetch the updated profile data
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
        // Force the window object to refresh the profile data
        if (typeof window !== 'undefined') {
          // First refresh profile sections data
          // @ts-ignore
          if (window.refreshProfileSections && typeof window.refreshProfileSections === 'function') {
            console.log('Calling window.refreshProfileSections()...');
            // @ts-ignore
            window.refreshProfileSections();
            console.log('Profile sections refreshed via global function');
          }
          
          // Then refresh the main profile data
          // @ts-ignore
          if (window.refreshProfileData && typeof window.refreshProfileData === 'function') {
            console.log('Calling window.refreshProfileData()...');
            // @ts-ignore
            window.refreshProfileData();
            console.log('Profile view refreshed via global function');
          } else {
            console.log('window.refreshProfileData is not available, using URL-based refresh');
            // Fallback to URL-based refresh
            const timestamp = Date.now();
            const currentPath = window.location.pathname;
            
            // Check if we're on a subdomain
            const hostname = window.location.hostname;
            const isSubdomain = hostname.includes('.') && !hostname.startsWith('www.');
            
            if (isSubdomain) {
              router.push(`${currentPath}?refresh=${timestamp}`);
            } else {
              router.push(`/profile?refresh=${timestamp}`);
            }
            console.log('Profile view refreshed via URL change, isSubdomain:', isSubdomain);
          }
        }
        
        // Close modal after successful update and data refresh
        handleClose();
      } catch (refreshError) {
        console.error('Error refreshing profile view:', refreshError);
        toast.error("Error refreshing data", {
          description: "Your changes were saved, but we couldn't refresh the page data.",
        });
        
        // Still close the modal even if there's a refresh error
        handleClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error toast
      toast.error("Update failed", {
        description: "There was a problem updating your profile. Please try again.",
      });
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
    avatar_url: profile?.avatar_url || "",
    background_url: profile?.background_url || "",
    work: (profile?.profile_sections?.work || profile?.custom_fields?.work || []) as WorkExperience[]
  };
  
  // Render the FocusModal with appropriate content based on modal type
  return (
    <FocusModal open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      {modalType === 'follow' ? (
        <FollowerModal 
          isOpen={true} 
          onClose={handleClose} 
          profileId={profile?.id} 
          username={profile?.username} 
        />
      ) : modalType === 'sections' ? (
        <FocusModal.Content className="max-w-3xl mx-auto" style={{ zIndex: 9999, display: 'flex', flexDirection: 'column', height: '90vh', width: '100%' }}>
          <FocusModal.Header>
            <h2 className="text-xl font-semibold px-4 sm:px-0">Customize Profile Sections</h2>
          </FocusModal.Header>
          <FocusModal.Body className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-2xl mx-auto w-full">
              <ProfileSectionEditor
                profileId={profile.id}
                initialSections={profile.profile_sections || {}}
                onSave={handleFormSubmit}
              />
            </div>
          </FocusModal.Body>
          <FocusModal.Footer className="border-t border-gray-200 p-4 flex justify-end">
            <Button 
              form="profile-sections-form" 
              type="submit"
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </FocusModal.Footer>
        </FocusModal.Content>
      ) : (
        <FocusModal.Content className="max-w-3xl mx-auto" style={{ zIndex: 9999, display: 'flex', flexDirection: 'column', height: '90vh', width: '100%', overflow: 'hidden' }}>
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
              avatar_url: userData.avatar_url,
              background_url: userData.background_url,
              // For section-specific editing, pass the section data
              ...(modalType === "section-edit" && searchParams.get('section') ? 
                (() => {
                  const sectionKey = searchParams.get('section');
                  
                  // We'll just pass the section key to the ProfileEditForms component
                  // The component will fetch the section data and fields from the database
                  console.log('Section edit modal with section key:', sectionKey);
                  
                  // Let's check if we can find this section in the profile data
                  if (profile.profile_sections) {
                    console.log('Profile sections from profile data:', profile.profile_sections);
                  } else {
                    console.log('No profile_sections found in profile data');
                  }
                  
                  // Create a minimal initial data structure
                  // The SectionEditor component will fetch the full data
                  return {
                    sectionKey,
                    sectionData: { title: '' } // Minimal placeholder
                  };
                })() : {}),
              // For work item editing
              ...(workItemIndex !== undefined && modalType === "work-item" ? userData.work[workItemIndex] : {})
            }}
            workItemIndex={workItemIndex}
          />
        </FocusModal.Content>
      )}
    </FocusModal>
  );
}

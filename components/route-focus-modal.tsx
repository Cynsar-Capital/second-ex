"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { FocusModal } from "@medusajs/ui";
import { useState, useEffect } from 'react';
import { useProfile } from '@/lib/hooks/use-profile';
import { useProfileUpdate } from '@/lib/hooks/use-profile-update';
import { useProfileSections } from "@/lib/hooks/use-profile-sections";
import { ProfileData } from '@/types/profile';
import { getCurrentUser } from '@/supabase/utils';
import { FollowerModal } from './follower-modal';
import { ProfileEditModal } from './modals/profile-edit-modal';
import { SectionsEditModal } from './modals/sections-edit-modal';
import { LoadingModal } from './modals/loading-modal';

interface RouteFocusModalProps {
  profile?: ProfileData;
}

export function RouteFocusModal({ profile: initialProfile }: RouteFocusModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modalType = searchParams.get('type') as 'profile' | 'bio' | 'work' | 'work-item' | 'sections' | 'section-edit' | 'follow' | null;
  const workItemIndex = searchParams.get('index') ? parseInt(searchParams.get('index')!) : undefined;
  const sectionKey = searchParams.get('section');
  
  // Use TanStack Query to fetch and cache profile data
  const { 
    data: profile, 
    isLoading: isProfileLoading 
  } = useProfile(initialProfile?.id);
  
  // Define handleClose function first
  function handleClose() {
    // Remove query parameters and navigate back to the current path
    const currentPath = window.location.pathname;
    router.push(currentPath);
  }
  
  // Use our custom hook for profile updates
  const { updateProfile, isSubmitting } = useProfileUpdate({
    onSuccess: handleClose
  });
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch current user when component mounts
  useEffect(() => {
    async function fetchUser() {
      try {
        const { user } = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    
    fetchUser();
  }, []);
  
  // Set modal open state based on URL parameters
  useEffect(() => {
    setIsOpen(!!modalType);
  }, [modalType]);
  
  // Import our new hook
  const { updateSection, bulkUpdateSections } = useProfileSections();

  // Handle form submission
  async function handleFormSubmit(data: any) {
    if (!profile) return;
    
    console.log('Modal form submission:', { modalType, data, sectionKey });
    
    // Handle section-specific updates with our new hook
    if (modalType === 'section-edit' && sectionKey) {
      // Check if we have section data in the expected format
      if (data.section_id && data.fields) {
        // We have direct section data
        console.log('Updating section with direct data format:', data);
        
        // Ensure field IDs are properly preserved
        const fieldsWithIds = data.fields.map((field: any) => {
          // Log individual field to debug ID issues
          console.log('Processing field (direct format):', field);
          console.log('Field ID available:', field.id || field.field_id || 'NOT FOUND');
          
          return {
            // Field ID must be preserved for existing fields to be updated rather than recreated
            id: field.id || field.field_id, // Use either id format if available
            field_key: field.field_key,
            field_label: field.field_label,
            field_value: field.field_value,
            field_type: field.field_type,
            display_order: field.display_order || 0,
            section_id: data.section_id
          };
        });
        
        console.log('Direct fields with IDs properly mapped:', fieldsWithIds);
        
        await updateSection.mutateAsync({
          sectionId: data.section_id,
          sectionData: {
            title: data.title,
            section_key: data.section_key,
            display_order: data.display_order || 0
          },
          fields: fieldsWithIds
        });
        return;
      }
      
      // Check if we have profile_sections format
      if (data.profile_sections && sectionKey && data.profile_sections[sectionKey]) {
        const section = data.profile_sections[sectionKey];
        console.log('Updating section from profile_sections:', section);
        
        // Make sure field IDs are properly included for existing fields
        const fieldsWithIds = section.fields.map((field: any) => {
          // Log individual field to debug ID issues
          console.log('Processing field:', field);
          console.log('Field ID available:', field.id || field.field_id || 'NOT FOUND');
          
          return {
            // Field ID must be preserved for existing fields to be updated rather than recreated
            id: field.id || field.field_id, // Use either id format if available
            field_key: field.field_key,
            field_label: field.field_label,
            field_value: field.field_value,
            field_type: field.field_type,
            display_order: field.display_order || 0,
            section_id: section.section_id
          };
        });
        
        console.log('Fields with IDs properly mapped:', fieldsWithIds);
        
        await updateSection.mutateAsync({
          sectionId: section.section_id,
          sectionData: {
            title: section.title,
            section_key: section.section_key,
            display_order: section.display_order || 0
          },
          fields: fieldsWithIds
        });
        return;
      }
    }
    
    // Handle bulk section updates
    if (modalType === 'sections' && data.profile_sections) {
      console.log('Updating all profile sections:', data.profile_sections);
      
      // Convert profile_sections object to an array of sections
      const sectionsArray = Object.values(data.profile_sections).map((section: any) => {
        console.log('Processing section for bulk update:', section);
        console.log('Section ID:', section.section_id || section.id || 'NOT FOUND');
        
        // Properly map field IDs to preserve existing fields
        const fieldsWithIds = section.fields.map((field: any) => {
          // Log field IDs for debugging
          console.log('Processing field for bulk update:', field);
          console.log('Field ID available:', field.id || field.field_id || 'NOT FOUND');
          
          // Check if the field has a valid ID to update instead of insert
          const fieldId = field.id || field.field_id;
          
          return {
            id: fieldId, // This is critical - must preserve the field ID to avoid duplication
            field_key: field.field_key,
            field_label: field.field_label,
            field_value: field.field_value,
            field_type: field.field_type,
            display_order: field.display_order || 0,
            section_id: section.section_id || section.id
          };
        });
        
        return {
          id: section.section_id || section.id, // Support both ID formats
          profile_id: profile.id,
          title: section.title,
          section_key: section.section_key,
          display_order: section.display_order || 0,
          fields: fieldsWithIds
        };
      });
      
      await bulkUpdateSections.mutateAsync({
        profileId: profile.id,
        sections: sectionsArray
      });
      return;
    }
    
    // Fall back to the original update method for other cases
    await updateProfile(profile, modalType, data, workItemIndex, sectionKey);
  }
  
  // If no profile or modal type, don't render anything
  if (!profile && !isProfileLoading) return null;
  
  // Render the appropriate modal content based on the modal type
  return (
    <FocusModal open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      {isProfileLoading ? (
        <LoadingModal isOpen={isOpen} onClose={handleClose} />
      ) : modalType === 'follow' ? (
        <FollowerModal 
          isOpen={true} 
          onClose={handleClose} 
          profileId={profile?.id} 
          username={profile?.username} 
        />
      ) : modalType === 'sections' ? (
        <SectionsEditModal
          isOpen={isOpen}
          onClose={handleClose}
          onSubmit={handleFormSubmit}
          profile={profile!}
        />
      ) : (
        <ProfileEditModal
          isOpen={isOpen}
          onClose={handleClose}
          onSubmit={handleFormSubmit}
          profile={profile!}
          formType={modalType}
          workItemIndex={workItemIndex}
          sectionKey={sectionKey}
        />
      )}
    </FocusModal>
  );
}

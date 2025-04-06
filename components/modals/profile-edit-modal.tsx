"use client";

import { FocusModal, Button } from "@medusajs/ui";
import { ProfileData } from '@/types/profile';
import { ProfileEditForms } from '../profile-edit-forms';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  profile: ProfileData | undefined;
  formType: 'profile' | 'bio' | 'work' | 'work-item' | 'section-edit' | null;
  workItemIndex?: number;
  sectionKey?: string | null;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  onSubmit,
  profile,
  formType,
  workItemIndex,
  sectionKey
}: ProfileEditModalProps) {
  if (!profile) return null;

  // Extract profile data for the form
  const userData = {
    name: profile?.full_name || "",
    email: profile?.email || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
    avatar_url: profile?.avatar_url || "",
    background_url: profile?.background_url || "",
    // Directly use custom_fields.work as profile_sections is handled separately
    work: profile?.custom_fields?.work || []
  };
  
  console.log('Profile data for form:', { 
    hasCustomFields: !!profile?.custom_fields,
    workItems: userData.work.length
  });

  return (
    <FocusModal.Content className="max-w-3xl mx-auto" style={{ zIndex: 9999, display: 'flex', flexDirection: 'column', height: '90vh', width: '100%', overflow: 'hidden' }}>
      <ProfileEditForms
        open={isOpen}
        onClose={onClose}
        onSubmit={onSubmit}
        formType={formType || "profile"}
        initialData={{
          name: userData.name,
          email: userData.email,
          website: userData.website,
          bio: userData.bio,
          avatar_url: userData.avatar_url,
          background_url: userData.background_url,
          // For section-specific editing, pass section key and create an initialized sectionData object
          // This ensures we always have a valid sectionData object to work with
          ...(formType === "section-edit" && sectionKey ? 
            (() => {
              console.log('Opening section editor for section key:', sectionKey);
              
              return {
                sectionKey,
                sectionData: {
                  title: '', // Will be populated from the database
                  fields: [] // Initialize empty fields array
                }
              };
            })() : {}),
          // For work item editing
          ...(workItemIndex !== undefined && formType === "work-item" ? userData.work[workItemIndex] : {})
        }}
        workItemIndex={workItemIndex}
      />
    </FocusModal.Content>
  );
}

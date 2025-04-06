"use client";

import { FocusModal, Button, Text } from "@medusajs/ui";
import { ProfileData } from '@/types/profile';
import { ProfileSectionEditor } from '../profile-section-editor';

interface SectionsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  profile: ProfileData | undefined;
}

export function SectionsEditModal({
  isOpen,
  onClose,
  onSubmit,
  profile
}: SectionsEditModalProps) {
  if (!profile) return null;
  
  // Log section key information if available
  const params = new URLSearchParams(window.location.search);
  const sectionKey = params.get('sectionKey');
  if (sectionKey) {
    console.log(`Section edit modal with section key: ${sectionKey}`);
  }
  
  // Log profile sections data for debugging
  console.log(`Profile sections data:`, profile?.profile_sections);
  if (!profile?.profile_sections) {
    console.log(`No profile_sections found in profile data`);
  }
  
  // Use an empty object if profile_sections is undefined
  const initialSections = profile?.profile_sections || {};

  return (
    <FocusModal.Content className="max-w-3xl mx-auto" style={{ zIndex: 9999, display: 'flex', flexDirection: 'column', height: '90vh', width: '100%' }}>
      <FocusModal.Header>
        <h2 className="text-xl font-semibold px-4 sm:px-0">Customize Profile Sections</h2>
      </FocusModal.Header>
      <FocusModal.Body className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto w-full">
          <ProfileSectionEditor
            profileId={profile?.id || ""}
            initialSections={initialSections}
            onSave={onSubmit}
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
  );
}

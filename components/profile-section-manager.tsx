"use client";

import { useState, useEffect } from 'react';
import { Button, Text, Heading, Container } from "@medusajs/ui";
import { PlusIcon } from "@heroicons/react/24/outline";
import { 
  getProfileSectionsWithFields,
  ProfileSection
} from '@/lib/api/profile-sections';
import { ProfileSectionEditor } from './profile-section-editor';

interface ProfileSectionManagerProps {
  profileId: string;
  isOwner: boolean;
}

export function ProfileSectionManager({ profileId, isOwner }: ProfileSectionManagerProps) {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Fetch sections on component mount
  useEffect(() => {
    fetchSections();
  },);

  // Fetch sections from the API
  const fetchSections = async () => {
    try {
      setLoading(true);
      const { sections: sectionsData, error: apiError } = await getProfileSectionsWithFields(profileId);
      
      if (apiError) {
        throw apiError;
      }
      
      if (sectionsData) {
        // Transform the data to match the ProfileSection interface
        const formattedSections: ProfileSection[] = sectionsData.map(section => ({
          id: section.section_id,
          profile_id: profileId,
          title: section.title,
          section_key: section.section_key,
          fields: section.fields.map(field => ({
            id: field.field_id,
            section_id: section.section_id,
            field_key: field.field_key,
            field_label: field.field_label,
            field_value: field.field_value,
            field_type: field.field_type,
            display_order: 0 // Default value since it might not be present in the API response
          }))
        }));
        
        setSections(formattedSections);
      }
    } catch (err) {
      console.error('Error fetching profile sections:', err);
      setError('Failed to load profile sections');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new section
  const handleCreateSection = () => {
    setIsCreating(true);
    setActiveSection(null);
  };

  // Handle editing a section
  const handleEditSection = (sectionId: string) => {
    setIsEditing(true);
    setActiveSection(sectionId);
  };

  // Handle save completion
  const handleSaveComplete = async () => {
    setIsEditing(false);
    setIsCreating(false);
    setActiveSection(null);
    await fetchSections(); // Refresh sections after save
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setActiveSection(null);
  };

  // Show loading state
  if (loading && sections.length === 0) {
    return (
      <Container className="py-6">
        <Text>Loading profile sections...</Text>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container className="py-6">
        <Text className="text-red-500">{error}</Text>
      </Container>
    );
  }

  // Show editor when creating or editing
  if (isEditing || isCreating) {
    // Get the active section if editing
    const activeData = activeSection 
      ? sections.find(s => s.id === activeSection) 
      : null;
    
    return (
      <Container className="py-6">
        <div className="mb-4 flex justify-between items-center">
          <Heading level="h2">
            {isCreating ? 'Create New Section' : 'Edit Section'}
          </Heading>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
        
        <ProfileSectionEditor 
          profileId={profileId}
          initialSections={activeData ? { [activeData.section_key]: activeData.fields } : {}}
          onSave={async () => handleSaveComplete()}
        />
      </Container>
    );
  }

  // Show sections list
  return (
    <Container className="py-6">
      <div className="mb-6 flex justify-between items-center">
        <Heading level="h2">Profile Sections</Heading>
        
        {isOwner && (
          <Button 
            variant="primary" 
            onClick={handleCreateSection}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Section</span>
          </Button>
        )}
      </div>
      
      {sections.length === 0 ? (
        <Container className="p-6 text-center">
          <Text className="text-gray-500">
            {isOwner 
              ? 'You haven\'t created any profile sections yet. Click "Add Section" to get started.' 
              : 'This profile has no custom sections yet.'}
          </Text>
        </Container>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <Container key={section.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Heading level="h3">{section.title}</Heading>
                
                {isOwner && (
                  <Button 
                    variant="secondary" 
                    onClick={() => handleEditSection(section.id)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {(section.fields || []).map((field) => (
                  <div key={field.id} className="flex gap-2">
                    <Text className="font-medium">{field.field_label}:</Text>
                    <Text>{field.field_value}</Text>
                  </div>
                ))}
              </div>
            </Container>
          ))}
        </div>
      )}
    </Container>
  );
}

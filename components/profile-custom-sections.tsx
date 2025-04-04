"use client";

import { useEffect, useState, useCallback } from 'react';
import { Container, Text, IconButton } from "@medusajs/ui";
import { PencilSquare, Link as LinkIcon, Calendar } from "@medusajs/icons";
import { EnvelopeIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ProfileData } from '@/types/profile';
import { getProfileSectionsWithFields, deleteProfileSection, ProfileSection } from '@/lib/api/profile-sections';
import ProfileSectionTemplateSelector from './profile-section-template-selector';

interface ProfileCustomSectionsProps {
  profile: ProfileData;
  isOwner: boolean;
  onEditSection: (sectionId: string) => void;
}

export function ProfileCustomSections({ profile, isOwner, onEditSection }: ProfileCustomSectionsProps) {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);

  // Fetch sections from the new relational tables using our API
  const fetchSections = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      
      const { sections: sectionsData, error: apiError } = await getProfileSectionsWithFields(profile.id);
      
      if (apiError) {
        throw apiError;
      }
      
      if (sectionsData) {
        setSections(sectionsData);
      }
    } catch (err) {
      console.error('Error fetching profile sections:', err);
      setError('Failed to load profile sections');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, setLoading, setSections, setError]);
  
  useEffect(() => {
    if (profile?.id) {
      fetchSections();
    }
  }, [profile?.id, fetchSections]);

  // Function to determine icon based on field type or value
  const getFieldIcon = (key: string, value: string) => {
    // Handle null or undefined values
    if (!value) return null;
    
    // Check if it's a URL
    if (value.match(/^(https?:\/\/)/i)) {
      return <LinkIcon className="h-4 w-4 text-gray-500" />;
    }
    
    // Check if it's an email
    if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return <EnvelopeIcon className="h-4 w-4 text-gray-500" />;
    }
    
    // Check if it's a date
    if (value.match(/^\d{4}-\d{2}-\d{2}/) || key.includes('date')) {
      return <Calendar className="h-4 w-4 text-gray-500" />;
    }
    
    // Default: no icon
    return null;
  };

  // Sort sections by display_order
  const sortedSections = [...sections].sort((a, b) => {
    const aOrder = a.display_order ?? 0;
    const bOrder = b.display_order ?? 0;
    return aOrder - bOrder;
  });

  const handleAddNewSection = () => {
    setShowTemplateSelector(true);
  };
  
  const handleDeleteSection = async (sectionId: string) => {
    try {
      const { error: deleteError } = await deleteProfileSection(sectionId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Refresh sections list
      fetchSections();
    } catch (err) {
      console.error('Error deleting section:', err);
      setError('Failed to delete section');
    }
  };

  return (
    <>
      {loading ? (
        <Container className="mb-8">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg flex justify-center">
            <Text className="text-sm text-gray-500">Loading sections...</Text>
          </div>
        </Container>
      ) : error ? (
        <Container className="mb-8">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg">
            <Text className="text-sm text-red-500">{error}</Text>
          </div>
        </Container>
      ) : (
        <>
          {/* Template selector */}
          {showTemplateSelector && (
            <ProfileSectionTemplateSelector
              profileId={profile.id}
              onSectionAdded={() => {
                setShowTemplateSelector(false);
                fetchSections();
              }}
              onCancel={() => setShowTemplateSelector(false)}
            />
          )}
          
          {/* Empty state when no sections exist */}
          {sections.length === 0 ? (
            <Container className="mb-8">
              <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-white dark:bg-slate-800">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
                    <PlusIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">No sections found</Text>
                  {isOwner && (
                    <button
                      onClick={handleAddNewSection}
                      className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Your First Section
                    </button>
                  )}
                </div>
              </div>
            </Container>
          ) : (
            <>
              {/* Show sections when they exist */}
              {sortedSections.map((section) => (
                <Container key={section.id} className="mb-8">
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <Text size="large" className="font-bold">{section.title}</Text>
                      {isOwner && (
                        <div className="flex space-x-2">
                          <IconButton
                            variant="transparent"
                            size="small"
                            onClick={() => onEditSection(section.id)}
                          >
                            <PencilSquare className="h-4 w-4 text-gray-500" />
                          </IconButton>
                          <IconButton
                            variant="transparent"
                            size="small"
                            onClick={() => handleDeleteSection(section.id)}
                          >
                            <TrashIcon className="h-4 w-4 text-gray-500" />
                          </IconButton>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {(section.fields || []).map((field) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <Text size="small" className="text-gray-500">{field.field_label}</Text>
                          {getFieldIcon(field.field_key, field.field_value) && (
                            <div className="mr-2">{getFieldIcon(field.field_key, field.field_value)}</div>
                          )}
                          {field.field_value.match(/^(https?:\/\/)/i) ? (
                            <a 
                              href={field.field_value} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {field.field_value}
                            </a>
                          ) : (
                            <Text size="small">{field.field_value}</Text>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Container>
              ))}
              
              {/* Add section button for owners when at least one section exists */}
              {isOwner && sections.length > 0 && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleAddNewSection}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-1 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Section
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

export default ProfileCustomSections;
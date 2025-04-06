"use client";

import { useEffect, useState, useCallback } from 'react';
import { Container, Text, IconButton, Heading } from "@medusajs/ui";
import { PencilSquare, Link as LinkIcon, Calendar } from "@medusajs/icons";
import { EnvelopeIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ProfileData } from '@/types/profile';
import { getProfileSectionsWithFields, deleteProfileSection, ProfileSection } from '@/lib/api/profile-sections';
import ProfileSectionTemplateSelector from './profile-section-template-selector';

interface ProfileCustomSectionsProps {
  profile: ProfileData;
  isOwner: boolean;
  onEditSection: (type: string, workIndex?: number, sectionKey?: string) => void;
}

export function ProfileCustomSections({ profile, isOwner, onEditSection }: ProfileCustomSectionsProps) {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);

  // State to trigger data refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to manually trigger a refresh
  const refreshSections = useCallback(() => {
    console.log('Refreshing profile sections...');
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Expose the refresh function to the window object for direct access
  useEffect(() => {
    // @ts-ignore
    window.refreshProfileSections = refreshSections;
    
    return () => {
      // @ts-ignore
      delete window.refreshProfileSections;
    };
  }, [refreshSections]);
  
  // Fetch sections from the new relational tables using our API
  const fetchSections = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      console.log('Fetching profile sections for profile ID:', profile.id);
      
      const { sections: sectionsData, error: apiError } = await getProfileSectionsWithFields(profile.id);
      
      if (apiError) {
        throw apiError;
      }
      
      if (sectionsData) {
        console.log('Fetched sections:', sectionsData.length);
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
  }, [profile?.id, fetchSections, refreshTrigger]); // Added refreshTrigger to dependencies

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
            <div className="relative mb-8 max-w-4xl w-full">
              {/* Timeline dot - semi-circle with shadow - improved responsive sizing */}
              <div className="absolute left-[43px] sm:left-[65px] md:left-[75px] lg:left-[85px] xl:left-[85px] 2xl:left-[85px] top-0 w-4 h-2 overflow-hidden z-10">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 shadow-md transform -translate-y-1/2"></div>
              </div>
              <div className="p-6 pt-8 mt-[-8px] border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-slate-800 shadow-sm w-full">
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
            </div>
          ) : (
            <>
              {/* Show sections when they exist */}
              {sortedSections.map((section) => (
                <div key={section.id} className="relative mb-8 max-w-4xl w-full">
                  {/* Timeline dot - semi-circle with shadow - improved responsive sizing */}
                  <div className="absolute left-[43px] sm:left-[65px] md:left-[75px] lg:left-[85px] xl:left-[85px] 2xl:left-[85px] top-0 w-4 h-2 overflow-hidden z-10">
                    <div className="w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400 border-2 border-white dark:border-gray-800 shadow-md transform -translate-y-1/2"></div>
                  </div>
                  <div className="p-6 pt-8 mt-[-8px] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 w-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <Heading level="h2" className="text-xl font-semibold mb-2">{section.title}</Heading>
                        
                        {/* Description Field - Find and display the description field first */}
                        {section.fields && section.fields.find(field => 
                          field.field_key === 'description' || 
                          field.field_label.toLowerCase() === 'description'
                        ) && (
                          <div className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300">
                              {section.fields.find(field => 
                                field.field_key === 'description' || 
                                field.field_label.toLowerCase() === 'description'
                              )?.field_value}
                            </Text>
                          </div>
                        )}
                      </div>
                      
                      {isOwner && (
                        <div className="flex space-x-2 ml-4">
                          <IconButton
                            variant="transparent"
                            size="small"
                            onClick={() => onEditSection('section-edit', undefined, section.section_key)}
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
                    
                    {/* Other Fields - Display in a cleaner layout */}
                    <div className="space-y-3">
                      {/* First handle date fields specially */}
                      {(() => {
                        const startDateField = (section.fields || []).find(field => 
                          field.field_key === 'start_date' || 
                          field.field_label.toLowerCase().includes('start') ||
                          field.field_label.toLowerCase() === 'from date'
                        );
                        
                        const endDateField = (section.fields || []).find(field => 
                          field.field_key === 'end_date' || 
                          field.field_label.toLowerCase().includes('end') ||
                          field.field_label.toLowerCase() === 'to date'
                        );
                        
                        if (startDateField || endDateField) {
                          return (
                            <div className="flex items-center text-gray-700 dark:text-gray-300 mb-2">
                              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                              <Text>
                                {startDateField?.field_value || ''}
                                {startDateField?.field_value && endDateField?.field_value ? ' - ' : ''}
                                {endDateField?.field_value || ''}
                              </Text>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Then display other fields without their labels */}
                      {(section.fields || []).filter(field => 
                        field.field_key !== 'description' && 
                        field.field_label.toLowerCase() !== 'description' &&
                        !field.field_key.includes('date') &&
                        !field.field_label.toLowerCase().includes('date') &&
                        !field.field_label.toLowerCase().includes('start') &&
                        !field.field_label.toLowerCase().includes('end')
                      ).map((field) => (
                        <div key={field.id} className="flex items-center">
                          {getFieldIcon(field.field_key, field.field_value) && (
                            <div className="mr-2 text-gray-500">{getFieldIcon(field.field_key, field.field_value)}</div>
                          )}
                          {field.field_value.match(/^(https?:\/\/)/i) ? (
                            <a 
                              href={field.field_value} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {field.field_value}
                            </a>
                          ) : (
                            <Text className="text-gray-700 dark:text-gray-300">{field.field_value}</Text>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
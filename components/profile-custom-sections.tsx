"use client";

import { useState } from 'react';
import { Container, Text, IconButton, Heading, toast } from "@medusajs/ui";
import { PencilSquare, Link as LinkIcon, Calendar } from "@medusajs/icons";
import { EnvelopeIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ProfileData } from '@/types/profile';
import { deleteProfileSection, ProfileSection } from '@/lib/api/profile-sections';
import { useProfileSections } from '@/lib/hooks/use-profile-sections';
import ProfileSectionTemplateSelector from './profile-section-template-selector';

interface ProfileCustomSectionsProps {
  profile: ProfileData;
  isOwner: boolean;
  onEditSection: (type: string, workIndex?: number, sectionKey?: string) => void;
}

export function ProfileCustomSections({ profile, isOwner, onEditSection }: ProfileCustomSectionsProps) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Use the profile sections hook for data fetching with Tanstack Query
  const { useFetchProfileSections, deleteSection: deleteSectionMutation } = useProfileSections();
  
  // Fetch sections using Tanstack Query
  const { 
    data: sections = [], 
    isLoading: loading,
    error: queryError,
    refetch
  } = useFetchProfileSections(profile?.id || '');
  
  // Handle any query errors
  if (queryError) {
    console.error('Error in profile sections query:', queryError);
  }
  
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

  // Sort sections alphabetically by title since display_order might not be available
  const sortedSections = [...sections].sort((a, b) => {
    // Attempt to use display_order if available, otherwise fall back to title sorting
    const displayOrderA = (a as any).display_order;
    const displayOrderB = (b as any).display_order;
    
    if (displayOrderA !== undefined && displayOrderB !== undefined) {
      return displayOrderA - displayOrderB;
    }
    return a.title.localeCompare(b.title);
  });

  const handleAddNewSection = () => {
    setShowTemplateSelector(true);
  };
  
  const handleDeleteSection = async (sectionId: string | undefined) => {
    if (!sectionId) {
      console.error('Cannot delete section: No section ID provided');
      setError('Failed to delete section: Missing ID');
      toast.error('Failed to delete section: Missing ID');
      return;
    }
    
    // Find the section to get its title for confirmation
    console.log('All section IDs:', sections.map(s => s.section_id));
    console.log('Section ID to delete:', sectionId);
    
    // Try to find the section with a string comparison in case of type issues
    const sectionToDelete = sections.find(section => String(section.section_id) === String(sectionId));
    if (!sectionToDelete) {
      console.error(`Cannot find section with ID: ${sectionId}`);
      setError(`Failed to delete section: Section with ID ${sectionId} not found`);
      toast.error(`Failed to delete section: Section not found`);
      return;
    }
    
    console.log('Found section to delete:', sectionToDelete);
    
    // Use the mutation from the hook to delete the section
    try {
      // Show a loading toast for better UX
      const loadingToast = toast.loading(`Deleting ${sectionToDelete.title} section...`);
      
      // Call the mutation to delete the section - must use object with sectionId property
      await deleteSectionMutation.mutateAsync({ sectionId }, {
        onSuccess: () => {
          // Dismiss loading toast
          toast.dismiss(loadingToast);
          
          // Set success message for the UI
          setMessage(`The "${sectionToDelete.title}" section has been deleted successfully.`);
          
          // Invalidate queries is handled by the mutation's onSuccess callback
          // Call refetch to ensure UI is updated immediately
          refetch();
          
          // Set a timeout to clear the message
          setTimeout(() => setMessage(''), 3000);
        },
        onError: (error: Error) => {
          // Dismiss loading toast
          toast.dismiss(loadingToast);
          
          // Log and display error
          console.error('Error deleting section:', error);
          setError(`Failed to delete section: ${error.message || 'Unknown error'}`);
        }
      });
    } catch (err) {
      console.error('Error deleting section:', err);
      // Handle the error and provide user feedback
      setError(`Failed to delete section: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error('Failed to delete section', {
        description: err instanceof Error ? err.message : 'An error occurred',
        duration: 5000
      });
    }
  };

  return (
    <>
      {/* Success message */}
      {message && (
        <Container className="mb-4">
          <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
            <Text className="text-sm text-green-700 dark:text-green-300">{message}</Text>
          </div>
        </Container>
      )}
      
      {/* Error message */}
      {error && (
        <Container className="mb-4">
          <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <Text className="text-sm text-red-700 dark:text-red-300">{error}</Text>
          </div>
        </Container>
      )}
      
      {loading ? (
        <Container className="mb-8">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg flex justify-center">
            <Text className="text-sm text-gray-500">Loading sections...</Text>
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
                // Explicitly call refetch to update the UI with the newly added section
                refetch();
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
                <div key={section.section_id} className="relative mb-8 max-w-4xl w-full">
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
                            onClick={() => {
                              console.log('Delete button clicked. Section data:', section);
                              // Make sure we have a valid ID to delete
                              if (section.section_id) {
                                handleDeleteSection(section.section_id);
                              } else {
                                console.error('No valid section ID found for deletion');
                                setError('Cannot delete section: Missing ID');
                              }
                            }}
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
                              <div>
                                <Text>
                                  {startDateField?.field_label && <span className="font-medium">{startDateField.field_label}: </span>}
                                  <span className="font-normal">
                                    {startDateField?.field_value || ''}
                                    {startDateField?.field_value && endDateField?.field_value ? ' - ' : ''}
                                    {endDateField?.field_value || ''}
                                  </span>
                                </Text>
                              </div>
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
                        <div key={field.field_id || `${section.section_id}-${field.field_key}`} className="flex items-center">
                          {getFieldIcon(field.field_key, field.field_value) && (
                            <div className="mr-2 text-gray-500">{getFieldIcon(field.field_key, field.field_value)}</div>
                          )}
                          <div>
                            <Text className="font-medium text-gray-700 dark:text-gray-300">
                              {field.field_label}: {' '}
                              {field.field_value.match(/^(https?:\/\/)/i) ? (
                                <a 
                                  href={field.field_value} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-normal"
                                >
                                  {field.field_value}
                                </a>
                              ) : (
                                <span className="font-normal">{field.field_value}</span>
                              )}
                            </Text>
                          </div>
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
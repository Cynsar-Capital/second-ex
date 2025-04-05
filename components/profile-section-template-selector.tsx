import React, { useState } from 'react';
import { Button, Container, Text, Heading, toast } from '@medusajs/ui';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { allSectionTemplates, createSectionFromTemplate } from '../lib/templates/profile-section-templates';
import { createProfileSection } from '../lib/api/profile-sections';
import { createProfileSectionField } from '../lib/api/profile-section-fields';

interface ProfileSectionTemplateSelectorProps {
  profileId: string;
  onSectionAdded: () => void;
  onCancel: () => void;
}

export default function ProfileSectionTemplateSelector({
  profileId,
  onSectionAdded,
  onCancel
}: ProfileSectionTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
  };

  // Check if a section with the same key already exists and get count
  const checkForDuplicateSections = async (sectionKey: string) => {
    try {
      // Make a request to check if a section with this key already exists for this profile
      const response = await fetch(`/api/profile-sections/check-duplicate?profileId=${profileId}&sectionKey=${sectionKey}`);
      const data = await response.json();
      return {
        exists: data.exists,
        count: data.count || 0
      };
    } catch (err) {
      console.error('Error checking for duplicate section:', err);
      return { exists: false, count: 0 }; // Assume no duplicate if we can't check
    }
  };

  const handleAddSection = async () => {
    if (!selectedTemplate) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get the template data
      const templateData = createSectionFromTemplate(selectedTemplate, profileId);
      
      if (!templateData) {
        throw new Error('Template not found');
      }
      
      // Create the section
      const { section: sectionTemplate, fields: fieldsTemplate } = templateData;
      
      // Check if this section type already exists for this profile and get count
      const { exists, count } = await checkForDuplicateSections(sectionTemplate.section_key);
      
      // If it's a duplicate, automatically create a numbered title
      let customTitle = sectionTemplate.title;
      if (exists) {
        // Create a numbered title (e.g., "Work Experience 2")
        customTitle = `${sectionTemplate.title} ${count + 1}`;
        
        // Show a toast notification to inform the user
        toast.info("Creating duplicate section", {
          description: `Creating "${customTitle}" as you already have a ${sectionTemplate.title} section.`,
        });
      }
      
      // Save the section to the database with potentially custom title
      const { section, error: sectionError } = await createProfileSection(profileId, {
        title: customTitle,
        section_key: sectionTemplate.section_key,
        display_order: 0, // Will be updated when saved
        fields: [] // Empty fields array to satisfy the type
      });
      
      if (sectionError || !section) {
        throw new Error(sectionError ? sectionError.toString() : 'Failed to create section');
      }
      
      // Save all fields for this section
      for (const fieldTemplate of fieldsTemplate) {
        const { error: fieldError } = await createProfileSectionField(section.id, {
          field_key: fieldTemplate.field_key,
          field_label: fieldTemplate.field_label,
          field_type: fieldTemplate.field_type,
          field_value: fieldTemplate.field_value || '',
          display_order: fieldTemplate.display_order,
        });
        
        if (fieldError) {
          throw new Error(`Failed to create field: ${fieldError ? fieldError.toString() : 'Unknown error'}`);
        }
      }
      
      // Notify parent component that section was added
      onSectionAdded();
    } catch (err: any) {
      console.error('Error adding section from template:', err);
      setError(err.message || 'An error occurred while adding the section');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="my-8">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="mb-6">
          <Heading level="h2" className="text-xl font-semibold mb-2">Add a New Section</Heading>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Choose a template to quickly add a new section to your profile
          </Text>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
            <Text className="text-sm">{error}</Text>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {allSectionTemplates.map((template) => (
            <div 
              key={template.section_key}
              className={`
                border rounded-lg p-4 cursor-pointer transition-colors
                ${selectedTemplate === template.section_key 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'}
              `}
              onClick={() => handleSelectTemplate(template.section_key)}
            >
              <div className="flex items-start mb-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mr-3">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <Text className="font-medium">{template.title}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.fields.length} fields
                  </Text>
                </div>
              </div>
              <Text className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {template.description}
              </Text>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddSection}
            disabled={!selectedTemplate || isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Section
              </>
            )}
          </Button>
        </div>
      </div>
    </Container>
  );
}

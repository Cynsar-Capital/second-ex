"use client";

import { useState, useEffect } from 'react';
import { Button, Input, Label, Text, Textarea, Select } from "@medusajs/ui";
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import { 
  createProfileSection, 
  updateProfileSection, 
  deleteProfileSection, 
  reorderProfileSections,
  reorderProfileSectionFields,
  ProfileSection,
  ProfileSectionField,
  NewProfileSection,
  NewProfileSectionField
} from '@/lib/api/profile-sections';

interface Field {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'url' | 'email' | 'date' | 'textarea';
}

interface Section {
  id: string;
  title: string;
  fields: Field[];
}

interface ProfileSectionEditorProps {
  profileId: string;
  initialSections?: Record<string, any>;
  onSave: (sections: Record<string, any>) => Promise<void>;
}

export function ProfileSectionEditor({ profileId, initialSections = {}, onSave }: ProfileSectionEditorProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSection, setNewSection] = useState<Section | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Initialize sections from profile data
  useEffect(() => {
    if (initialSections) {
      const formattedSections: Section[] = [];
      
      // Convert the sections object to our format
      Object.entries(initialSections).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle array of fields
          if (Array.isArray(value)) {
            const fields: Field[] = value.map((item, index) => ({
              id: `${key}-field-${index}`,
              label: item.label || `Field ${index + 1}`,
              value: item.value || '',
              type: item.type || 'text'
            }));
            
            formattedSections.push({
              id: key,
              title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
              fields
            });
          } 
          // Handle object with key-value pairs
          else {
            const fields: Field[] = Object.entries(value).map(([fieldKey, fieldValue], index) => ({
              id: `${key}-field-${index}`,
              label: fieldKey,
              value: String(fieldValue || ''),
              type: 'text'
            }));
            
            formattedSections.push({
              id: key,
              title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
              fields
            });
          }
        }
      });
      
      setSections(formattedSections);
    }
  }, [initialSections]);

  // Add a new section
  const addSection = () => {
    const newId = `section-${Date.now()}`;
    const sectionToAdd = {
      id: newId,
      title: 'New Section',
      fields: []
    };
    
    // Set creating new mode and store the new section separately
    setIsCreatingNew(true);
    setNewSection(sectionToAdd);
    
    // Add a default field to make it easier for users
    addFieldToNewSection(sectionToAdd);
  };
  
  // Add a default field to a new section
  const addFieldToNewSection = (section: Section = newSection!) => {
    if (section) {
      const newField: Field = {
        id: `field-${Date.now()}`,
        label: 'New Field',
        value: '',
        type: 'text'
      };
      
      if (section === newSection) {
        setNewSection({ ...section, fields: [...section.fields, newField] });
      }
    }
  };

  // Remove a section
  const removeSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  // Update section title
  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, title } : section
    ));
  };

  // Add a field to a section
  const addField = (sectionId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const newField: Field = {
          id: `field-${Date.now()}`,
          label: 'New Field',
          value: '',
          type: 'text'
        };
        return { ...section, fields: [...section.fields, newField] };
      }
      return section;
    }));
  };

  // Remove a field from a section
  const removeField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, fields: section.fields.filter(field => field.id !== fieldId) };
      }
      return section;
    }));
  };

  // Update a field
  const updateField = (sectionId: string, fieldId: string, updates: Partial<Field>) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.map(field => 
            field.id === fieldId ? { ...field, ...updates } : field
          )
        };
      }
      return section;
    }));
  };

  // Move a section up or down
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(section => section.id === sectionId);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sections.length - 1)
    ) {
      return; // Can't move further
    }

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  // Move a field up or down within a section
  const moveField = (sectionId: string, fieldId: string, direction: 'up' | 'down') => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const fields = [...section.fields];
        const index = fields.findIndex(field => field.id === fieldId);
        
        if (
          (direction === 'up' && index === 0) || 
          (direction === 'down' && index === fields.length - 1)
        ) {
          return section; // Can't move further
        }

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [fields[index], fields[targetIndex]] = [fields[targetIndex], fields[index]];
        
        return { ...section, fields };
      }
      return section;
    }));
  };

  // Convert sections to the format expected by the database
  const formatSectionsForSave = (sectionsToUse?: Section[]): Record<string, any> => {
    const formattedSections: Record<string, any> = {};
    
    // Get the sections to format (either provided sections, or existing sections or existing + new section)
    const sectionsToFormat = sectionsToUse || (isCreatingNew && newSection 
      ? [...sections, newSection] 
      : sections);
    
    sectionsToFormat.forEach(section => {
      // Create a normalized ID for the section (lowercase, underscores)
      const normalizedId = section.title.toLowerCase().replace(/\s+/g, '_');
      
      // Format the fields based on their structure
      const formattedFields: Record<string, any> = {};
      section.fields.forEach(field => {
        // Use the field label as the key (normalized)
        const fieldKey = field.label.toLowerCase().replace(/\s+/g, '_');
        formattedFields[fieldKey] = field.value;
      });
      
      formattedSections[normalizedId] = formattedFields;
    });
    
    return formattedSections;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Process each section
      for (const section of sections) {
        // Determine if this is an existing section or a new one
        const isExistingSection = section.id && section.id.includes('-') === false;
        
        if (isExistingSection) {
          // Update existing section
          const sectionData = {
            title: section.title,
            display_order: sections.indexOf(section)
          };
          
          // Convert fields to the format expected by the API
          const fields = section.fields.map((field, index) => ({
            id: field.id && field.id.includes('-') === false ? field.id : undefined,
            field_key: field.label.toLowerCase().replace(/\s+/g, '_'),
            field_label: field.label,
            field_value: field.value,
            field_type: field.type,
            display_order: index
          }));
          
          const { error } = await updateProfileSection(section.id, sectionData, fields);
          
          if (error) throw error;
        } else {
          // Create new section
          const newSection: NewProfileSection = {
            title: section.title,
            section_key: section.title.toLowerCase().replace(/\s+/g, '_'),
            display_order: sections.indexOf(section),
            fields: section.fields.map((field, index) => ({
              field_key: field.label.toLowerCase().replace(/\s+/g, '_'),
              field_label: field.label,
              field_value: field.value,
              field_type: field.type,
              display_order: index
            }))
          };
          
          const { error } = await createProfileSection(profileId, newSection);
          
          if (error) throw error;
        }
      }
      
      // If we have a callback, call it with an empty object (for backwards compatibility)
      if (onSave) {
        await onSave({});
      }
      
      // Reset creating new mode
      setIsCreatingNew(false);
      setNewSection(null);
      setActiveSection(null);
    } catch (err) {
      console.error('Error saving sections:', err);
      setError('Failed to save profile sections');
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel creating new section
  const cancelNewSection = () => {
    setIsCreatingNew(false);
    setNewSection(null);
  };
  
  // Update new section title
  const updateNewSectionTitle = (title: string) => {
    if (newSection) {
      setNewSection({ ...newSection, title });
    }
  };
  
  // Add a field manually to the new section
  const addFieldManually = () => {
    if (newSection) {
      const newField: Field = {
        id: `field-${Date.now()}`,
        label: 'New Field',
        value: '',
        type: 'text'
      };
      setNewSection({ ...newSection, fields: [...newSection.fields, newField] });
    }
  };
  
  // Remove a field from the new section
  const removeFieldFromNewSection = (fieldId: string) => {
    if (newSection) {
      setNewSection({
        ...newSection,
        fields: newSection.fields.filter(field => field.id !== fieldId)
      });
    }
  };
  
  // Update a field in the new section
  const updateFieldInNewSection = (fieldId: string, updates: Partial<Field>) => {
    if (newSection) {
      setNewSection({
        ...newSection,
        fields: newSection.fields.map(field => 
          field.id === fieldId ? { ...field, ...updates } : field
        )
      });
    }
  };
  
  // Move a field up or down within the new section
  const moveFieldInNewSection = (fieldId: string, direction: 'up' | 'down') => {
    if (newSection) {
      const fields = [...newSection.fields];
      const index = fields.findIndex(field => field.id === fieldId);
      
      if (
        (direction === 'up' && index === 0) || 
        (direction === 'down' && index === fields.length - 1)
      ) {
        return; // Can't move further
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [fields[index], fields[targetIndex]] = [fields[targetIndex], fields[index]];
      
      setNewSection({ ...newSection, fields });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Text size="large" weight="plus">Profile Sections</Text>
        {!isCreatingNew && activeSection === null && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={addSection}
            className="flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Add Section
          </Button>
        )}
      </div>
      
      {/* Show message when no sections and not creating new */}
      {sections.length === 0 && !isCreatingNew && activeSection === null && (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
          <Text className="text-gray-500">No sections yet. Click &quot;Add Section&quot; to create your first section.</Text>
        </div>
      )}
      
      {/* Show section list when not creating new and no active section */}
      {!isCreatingNew && activeSection === null && sections.length > 0 && (
        <div className="space-y-4">
          <div className="mb-4">
            <Text size="small" className="text-gray-500 mb-2">Click on a section to edit it</Text>
          </div>
          {sections.map((section, index) => (
            <div 
              key={section.id} 
              className="p-4 border rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setActiveSection(section.id)}
            >
              <div className="flex-1">
                <Text weight="plus">{section.title}</Text>
                <Text size="small" className="text-gray-500">{section.fields.length} {section.fields.length === 1 ? 'field' : 'fields'}</Text>
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSection(section.id);
                }}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Show back button when editing an existing section */}
      {!isCreatingNew && activeSection !== null && (
        <div className="mb-4">
          <Button 
            type="button" 
            variant="secondary" 
            size="small"
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-1"
          >
            ← Back to Sections
          </Button>
        </div>
      )}
      
      {/* Show active section for editing */}
      {!isCreatingNew && activeSection !== null && sections.map((section, sectionIndex) => (
        section.id === activeSection && (
          <div key={section.id} className="border rounded-md p-4 mb-4 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
              <Input
                value={section.title}
                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                placeholder="Section Title"
                className="font-semibold"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="small"
                onClick={() => moveSection(section.id, 'up')}
                disabled={sectionIndex === 0}
                className="p-1"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="small"
                onClick={() => moveSection(section.id, 'down')}
                disabled={sectionIndex === sections.length - 1}
                className="p-1"
              >
                <ArrowDownIcon className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="danger" 
                size="small"
                onClick={() => removeSection(section.id)}
                className="p-1"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 mt-4">
            {section.fields.map((field, fieldIndex) => (
              <div key={field.id} className="border-t pt-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <Label htmlFor={`${field.id}-label`}>Field Label</Label>
                    <Input
                      id={`${field.id}-label`}
                      value={field.label}
                      onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                      placeholder="Field Label"
                    />
                  </div>
                  <div className="col-span-6">
                    <Label htmlFor={`${field.id}-value`}>Value</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={`${field.id}-value`}
                        value={field.value}
                        onChange={(e) => updateField(section.id, field.id, { value: e.target.value })}
                        placeholder="Field Value"
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={`${field.id}-value`}
                        type={field.type}
                        value={field.value}
                        onChange={(e) => updateField(section.id, field.id, { value: e.target.value })}
                        placeholder="Field Value"
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`${field.id}-type`}>Type</Label>
                    <Select 
                      value={field.type}
                      onValueChange={(value) => updateField(section.id, field.id, { type: value as Field['type'] })}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Field Type" />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="text">Text</Select.Item>
                        <Select.Item value="url">URL</Select.Item>
                        <Select.Item value="email">Email</Select.Item>
                        <Select.Item value="date">Date</Select.Item>
                        <Select.Item value="textarea">Text Area</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="small"
                    onClick={() => moveField(section.id, field.id, 'up')}
                    disabled={fieldIndex === 0}
                    className="p-1"
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="small"
                    onClick={() => moveField(section.id, field.id, 'down')}
                    disabled={fieldIndex === section.fields.length - 1}
                    className="p-1"
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="danger" 
                    size="small"
                    onClick={() => removeField(section.id, field.id)}
                    className="p-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="secondary" 
              size="small"
              onClick={() => addField(section.id)}
              className="mt-3 w-full flex items-center justify-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              Add Field
            </Button>
          </div>
        </div>
      )))}
      
      {/* Show new section form when creating new */}
      {isCreatingNew && newSection && (
        <div className="border rounded-md p-4 mb-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
              <Input
                value={newSection.title}
                onChange={(e) => updateNewSectionTitle(e.target.value)}
                placeholder="Section Title"
                className="font-semibold"
              />
            </div>
          </div>
          
          <div className="space-y-4 mt-4">
            {newSection.fields.map((field, fieldIndex) => (
              <div key={field.id} className="border-t pt-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <Label htmlFor={`${field.id}-label`}>Field Label</Label>
                    <Input
                      id={`${field.id}-label`}
                      value={field.label}
                      onChange={(e) => updateFieldInNewSection(field.id, { label: e.target.value })}
                      placeholder="Field Label"
                    />
                  </div>
                  <div className="col-span-6">
                    <Label htmlFor={`${field.id}-value`}>Value</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={`${field.id}-value`}
                        value={field.value}
                        onChange={(e) => updateFieldInNewSection(field.id, { value: e.target.value })}
                        placeholder="Field Value"
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={`${field.id}-value`}
                        type={field.type}
                        value={field.value}
                        onChange={(e) => updateFieldInNewSection(field.id, { value: e.target.value })}
                        placeholder="Field Value"
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`${field.id}-type`}>Type</Label>
                    <Select 
                      value={field.type}
                      onValueChange={(value) => updateFieldInNewSection(field.id, { type: value as Field['type'] })}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Field Type" />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="text">Text</Select.Item>
                        <Select.Item value="url">URL</Select.Item>
                        <Select.Item value="email">Email</Select.Item>
                        <Select.Item value="date">Date</Select.Item>
                        <Select.Item value="textarea">Text Area</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="small"
                    onClick={() => moveFieldInNewSection(field.id, 'up')}
                    disabled={fieldIndex === 0}
                    className="p-1"
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="small"
                    onClick={() => moveFieldInNewSection(field.id, 'down')}
                    disabled={fieldIndex === newSection.fields.length - 1}
                    className="p-1"
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="danger" 
                    size="small"
                    onClick={() => removeFieldFromNewSection(field.id)}
                    className="p-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="secondary" 
              size="small"
              onClick={addFieldManually}
              className="mt-3 w-full flex items-center justify-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              Add Field
            </Button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 mt-2">
          {error}
        </div>
      )}
      
      <div className="flex justify-end gap-3 mt-6">
        {isCreatingNew && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={cancelNewSection}
          >
            Cancel
          </Button>
        )}
        {!isCreatingNew && activeSection !== null && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => setActiveSection(null)}
          >
            Back
          </Button>
        )}
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Sections'}
        </Button>
      </div>
    </form>
  );
}

import { useState, useRef, useEffect } from "react";
import { Button, FocusModal, Input, Label, Text, Textarea, Avatar, DatePicker, toast } from "@medusajs/ui";
import {  ArrowUpTray } from "@medusajs/icons";
import { uploadImage } from "@/supabase/storage";
import {  getProfileSectionsWithFields } from "@/lib/api/profile-sections";
import { getCurrentUser } from "@/supabase/utils";

interface ProfileEditFormsProps {
  open: boolean;
  onClose: () => void;
  formType: "profile" | "bio" | "work" | "work-item" | "section-edit";
  initialData?: any;
  onSubmit: (data: any) => void;
  workItemIndex?: number;
}

// Section Editor component for handling section editing with fields from database
const SectionEditor = ({ formData, setFormData }: { formData: any, setFormData: (data: any) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  
  // Use refs to track the latest values without causing re-renders
  const formDataRef = useRef(formData);
  const setFormDataRef = useRef(setFormData);
  
  // Update refs when props change
  useEffect(() => {
    formDataRef.current = formData;
    setFormDataRef.current = setFormData;
    
    // Reset fetch state if key changes
    if (formData.sectionKey !== formDataRef.current.sectionKey) {
      setDataFetched(false);
    }
    
    // Mark as fetched if we have section data with fields
    if (formData.sectionData?.fields && formData.sectionData.fields.length > 0) {
      setDataFetched(true);
    }
  }, [formData, setFormData]);
  
  // Fetch section fields from the database when component mounts
  useEffect(() => {
    // Create a flag to track if the component is mounted
    let isMounted = true;
    
    const fetchSectionFields = async () => {
      // If we've already successfully fetched data, skip
      if (dataFetched) {
        console.log('Data already fetched, skipping fetch');
        return;
      }
      
      const currentFormData = formDataRef.current;
      
      // Check if we have an identifier to look up the section
      if (!currentFormData.sectionId && !currentFormData.sectionKey) {
        console.log('No section ID or key provided, cannot fetch section data');
        setError('No section identifier provided');
        return;
      }
      
      // Special case: if we already have fields data (likely from a template), just mark as fetched
      if (currentFormData.sectionData?.fields?.length > 0) {
        console.log('Using pre-initialized fields from section template:', currentFormData.sectionData.fields.length, 'fields');
        setDataFetched(true);
        return;
      }
      
      // Log which identifier we'll use to fetch
      console.log('Will fetch section data based on:', {
        id: currentFormData.sectionId || 'Not provided',
        key: currentFormData.sectionKey || 'Not provided'
      });
      
      // Start loading state
      setIsLoading(true);
      setError(null);
      
      try {
        const currentFormData = formDataRef.current;
        console.log('Fetching section fields for:', {
          sectionId: currentFormData.sectionId || 'Not provided (using key instead)',
          sectionKey: currentFormData.sectionKey || 'Not provided (using ID instead)'
        });
        
        // Log a more descriptive message about the lookup strategy
        if (currentFormData.sectionId) {
          console.log(`Will look up section by ID: ${currentFormData.sectionId}`);
        } else if (currentFormData.sectionKey) {
          console.log(`Will look up section by key: ${currentFormData.sectionKey}`);
        } else {
          console.log('Warning: Neither section ID nor key provided');
        }
        
        // Get current user to get profile ID
        const { user, error: userError } = await getCurrentUser();
        if (userError) {
          console.error('Error getting current user:', userError);
          throw new Error(`User authentication error: ${userError.message}`);
        }
        
        if (!user) {
          console.error('No user found from getCurrentUser');
          throw new Error('User not authenticated - no user found');
        }
        
        // Fetch all sections with fields for this profile
        const { sections, error: sectionsError } = await getProfileSectionsWithFields(user.id);
        
        if (sectionsError) {
          console.error('Error fetching profile sections:', sectionsError);
          throw sectionsError;
        }
        
        // Find the specific section we're editing by ID or section_key
        const targetSection = sections.find(section => {
          // First try by ID if available
          if (currentFormData.sectionId && section.section_id === currentFormData.sectionId) {
            console.log(`Found section by ID match: ${section.section_id}`);
            return true;
          }
          
          // Then try by section_key if available
          if (currentFormData.sectionKey && section.section_key === currentFormData.sectionKey) {
            console.log(`Found section by key match: ${section.section_key}`);
            return true;
          }
          
          return false;
        });
        
        if (!targetSection) {
          console.error('Section not found in profile sections');
          throw new Error(`Section not found: ${currentFormData.sectionId || currentFormData.sectionKey}`);
        }
        
        console.log('Found target section:', targetSection);
        
        // Only update if component is still mounted
        if (isMounted) {
          // Update form data with the fetched fields
          setFormDataRef.current({
            ...currentFormData,
            sectionId: targetSection.section_id, // Ensure we have the ID for later
            sectionKey: targetSection.section_key, // Make sure we have the section key
            sectionData: {
              title: targetSection.title,
              fields: targetSection.fields || []
            },
            // Log success message
            lastFetchTime: new Date().toISOString()
          });
        }
      } catch (err: any) {
        console.error('Error fetching section fields:', err);
        if (isMounted) {
          setError(`Failed to load section fields: ${err.message || 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchSectionFields();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [dataFetched]); 
  
  // Handle field value changes
  const handleFieldChange = (index: number, value: string) => {
    const updatedFields = [...formData.sectionData.fields];
    updatedFields[index] = {
      ...updatedFields[index],
      field_value: value
    };
    
    setFormData({
      ...formData,
      sectionData: {
        ...formData.sectionData,
        fields: updatedFields
      }
    });
  };
  
  // Render the section editor with fields
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-pulse text-blue-500">Loading section data...</div>
            <div className="text-sm text-gray-500 mt-2">Fetching section details for {formData.sectionKey}</div>
          </div>
        </div>
      )}
      
      {/* Waiting for section data */}
      {!isLoading && !formData.sectionData?.fields && (
        <div className="p-4 border border-amber-300 rounded bg-amber-50 text-amber-800">
          <p className="font-medium">Waiting for section data...</p>
          <p className="text-sm mt-2">Looking for section with key: {formData.sectionKey}</p>
          <p className="text-sm mt-1">If this section doesn&apos;t exist yet, it will be created when you save.</p>
        </div>
      )}
      
      {/* Error message */}
      {error && <div className="text-red-500 p-2 border border-red-300 rounded bg-red-50">{error}</div>}
      
      {/* Title field - always present for all sections */}
      {!isLoading && formData?.sectionData && (
        <div className="mb-6">
          <Label htmlFor="title" className="text-base font-medium">Section Title</Label>
          <Input
            id="title"
            value={formData.sectionData.title || ''}
            onChange={(e) => {
              setFormData({
                ...formData,
                sectionData: { ...formData.sectionData, title: e.target.value }
              });
            }}
            className="w-full mt-2"
            required
            placeholder="Enter section title"
          />
        </div>
      )}

      {/* Fields section */}
      {!isLoading && formData?.sectionData?.fields && formData.sectionData.fields.length > 0 ? (
        <div className="space-y-6">
          <div className="text-sm text-green-600 mb-4">Section data loaded successfully</div>
          {formData.sectionData.fields.map((field: any, index: number) => (
            <div key={field.field_id || index} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label 
                htmlFor={`field-value-${index}`} 
                className="text-base font-medium mb-2 block"
              >
                {field.field_label}
              </Label>
              
              {/* Date picker for date fields */}
              {field.field_type === 'date' ? (
                <div className="w-full">
                  <DatePicker 
                    value={field.field_value ? new Date(field.field_value) : undefined}
                    onChange={(date) => {
                      const newFields = [...formData.sectionData.fields];
                      newFields[index] = { 
                        ...newFields[index], 
                        field_value: date ? date.toISOString().split('T')[0] : ''
                      };
                      setFormData({
                        ...formData,
                        sectionData: { ...formData.sectionData, fields: newFields }
                      });
                    }}
                  />
                </div>
              ) : field.field_type === 'textarea' || (field.field_value && field.field_value.length > 100) ? (
                <Textarea
                  id={`field-value-${index}`}
                  value={field.field_value || ''}
                  onChange={(e) => {
                    const newFields = [...formData.sectionData.fields];
                    newFields[index] = { 
                      ...newFields[index], 
                      field_value: e.target.value
                    };
                    setFormData({
                      ...formData,
                      sectionData: { ...formData.sectionData, fields: newFields }
                    });
                  }}
                  className="w-full mt-2"
                  rows={4}
                  placeholder={`Enter ${field.field_label || 'details'}`}
                />
              ) : (
                <Input
                  id={`field-value-${index}`}
                  value={field.field_value || ''}
                  onChange={(e) => {
                    const newFields = [...formData.sectionData.fields];
                    newFields[index] = { 
                      ...newFields[index], 
                      field_value: e.target.value
                    };
                    setFormData({
                      ...formData,
                      sectionData: { ...formData.sectionData, fields: newFields }
                    });
                  }}
                  className="w-full mt-2"
                  placeholder={`Enter ${field.field_label || 'value'}`}
                />
              )}
            </div>
          ))}
        </div>
      ) : !isLoading && formData?.sectionData ? (
        // Handle object-based section data for simple sections
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <p className="text-blue-700 font-medium">Setting up {formData.sectionKey} section</p>
            <p className="text-sm text-blue-600 mt-1">The section will be created with the fields defined below.</p>
          </div>
          
          {/* Convert object properties to fields or show existing ones */}
          {(() => {
            // Extract data fields (non-metadata) from the section data
            const dataFields = Object.entries(formData.sectionData).filter(([key]) => 
              !key.startsWith('_') && !['id', 'title', 'section_key', 'fields'].includes(key)
            );
            
            // If no data fields exist, add some helpful information
            if (dataFields.length === 0) {
              return (
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-gray-600">This section is ready to be saved with basic information.</p>
                  <p className="text-sm text-gray-500 mt-2">Fields will be defined based on the section template.</p>
                </div>
              );
            }
            
            // Otherwise, map through the data fields and display them for editing
            return dataFields.map(([key, value]: [string, any]) => {
              const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
              
              return (
                <div key={key} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <Label htmlFor={key} className="text-base font-medium mb-2 block">{fieldLabel}</Label>
                  {typeof value === 'string' && value.length > 100 ? (
                    <Textarea
                      id={key}
                      value={value}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          sectionData: { ...formData.sectionData, [key]: e.target.value }
                        });
                      }}
                      className="w-full mt-2"
                      rows={4}
                    />
                  ) : (
                    <Input
                      id={key}
                      value={value || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          sectionData: { ...formData.sectionData, [key]: e.target.value }
                        });
                      }}
                      className="w-full mt-2"
                    />
                  )}
                </div>
              );
            });
          })()
          }
        </div>
      ) : null}
    </div>
  );
};

export const ProfileEditForms = ({
  open,
  onClose,
  formType,
  initialData,
  onSubmit,
  workItemIndex
}: ProfileEditFormsProps) => {
  // State for form data
  const [formData, setFormData] = useState(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFileUploads, setHasFileUploads] = useState(false);
  
  // Update form data when initialData changes (e.g., when fresh data is fetched)
  useEffect(() => {
    console.log('ProfileEditForms: initialData changed', initialData);
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(initialData?.background_url || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to: '${value}'`, typeof value, value === '');
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Handle file input changes
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatarPreview(objectUrl);
      setFormData((prev: any) => ({ ...prev, avatarFile: file }));
    } else {
      setBackgroundPreview(objectUrl);
      setFormData((prev: any) => ({ ...prev, backgroundFile: file }));
    }
    
    // Indicate that this form has file uploads
    setHasFileUploads(true);
  };

  // Trigger file input click
  const triggerFileInput = (e: React.MouseEvent, type: 'avatar' | 'background') => {
    // Prevent the event from bubbling up and closing the modal
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'avatar' && avatarInputRef.current) {
      avatarInputRef.current.click();
    } else if (type === 'background' && backgroundInputRef.current) {
      backgroundInputRef.current.click();
    }
  };
  
  // Stop propagation for the entire form
  const handleFormClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Reset file upload flag if we're not in a form type that has file uploads
    if (formType !== 'profile') {
      setHasFileUploads(false);
    }
    
    try {
      const dataToSubmit = { ...formData };
      
      // Upload avatar if provided
      if (formData.avatarFile) {
        const { url: avatarUrl, error: avatarError } = await uploadImage(
          formData.avatarFile,
          'profile-images',
          'avatars'
        );
        
        if (avatarError) throw avatarError;
        if (avatarUrl) dataToSubmit.avatar_url = avatarUrl;
        
        // Remove the file object before submitting
        delete dataToSubmit.avatarFile;
      }
      
      // Upload background if provided
      if (formData.backgroundFile) {
        const { url: backgroundUrl, error: backgroundError } = await uploadImage(
          formData.backgroundFile,
          'profile-images',
          'backgrounds'
        );
        
        if (backgroundError) throw backgroundError;
        if (backgroundUrl) dataToSubmit.background_url = backgroundUrl;
        
        // Remove the file object before submitting
        delete dataToSubmit.backgroundFile;
      }
      
      // Handle section-edit form type
      if (formType === 'section-edit' && formData.sectionKey && formData.sectionData) {
        // Extract normal data properties to convert to fields if needed
        let fieldsArray = [];
        
        // If formData.sectionData.fields exists and is an array, use it as the base
        if (Array.isArray(formData.sectionData.fields)) {
          fieldsArray = formData.sectionData.fields.map((field: any) => ({
            // Ensure all required fields are present
            field_id: field.field_id || field.id || null,
            field_key: field.field_key || field.key || `field_${Math.random().toString(36).substring(2, 9)}`,
            field_label: field.field_label || field.label || 'Untitled Field',
            field_value: field.field_value || field.value || '',
            field_type: field.field_type || field.type || 'text'
          }));
        }
        
        // Now check for other properties that should be converted to fields
        // This handles the case where the section doesn't have a fields array yet
        Object.entries(formData.sectionData).forEach(([key, value]) => {
          // Skip metadata and already processed fields
          if (key.startsWith('_') || ['id', 'title', 'section_key', 'fields'].includes(key)) {
            return;
          }
          
          // Convert property to a field
          fieldsArray.push({
            field_id: null, // New field
            field_key: key,
            field_label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            field_value: value || '',
            field_type: typeof value === 'string' && value.length > 100 ? 'textarea' : 'text'
          });
        });
        
        // Prepare the data for section update with the complete fields array
        const sectionUpdateData = {
          section_key: formData.sectionKey,
          section_id: formData.sectionId, // This will be set by our SectionEditor component
          title: formData.sectionData.title || '',
          fields: fieldsArray
        };
        
        console.log('Section edit submitted with data:', sectionUpdateData);
        
        try {
          // Submit the update
          await onSubmit(sectionUpdateData);
          
          // Show success message
          toast.success("Section updated successfully");
          
          // Close the modal
          onClose();
        } catch (error) {
          console.error('Error updating section:', error);
          toast.error("Failed to update section");
        }
        
        return;
      }
      
      // Add explicit log for debugging empty values
      console.log('Form submitted with data:', dataToSubmit);
      console.log('Bio value type:', typeof dataToSubmit.bio, 'Length:', dataToSubmit.bio?.length, 'Value:', JSON.stringify(dataToSubmit.bio));
      
      // Call onSubmit with the processed data
      await onSubmit(dataToSubmit);
      
      // TanStack Query will handle data refreshing automatically
      
      // Don't show toast here, let RouteFocusModal handle it
    } catch (error) {
      console.error('Error processing form:', error);
      toast.error("Save failed", {
        description: "There was a problem updating your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

// ...
  // Determine form title and content based on formType
  const { title, subtitle, form } = (() => {
    switch (formType) {
      case "profile":
        return {
          title: "Edit Profile Information",
          subtitle: "Update your profile details",
          form: (
            <>
              <div className="mb-4">
                <Label htmlFor="avatar">Profile Picture</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Avatar
                    src={avatarPreview || formData.avatar_url}
                    fallback={(formData.name || "U").charAt(0)}
                    className="h-16 w-16"
                  />
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={(e) => triggerFileInput(e, 'avatar')}
                    className="gap-x-2"
                    type="button" // Explicitly set type to button to prevent form submission
                  >
                    <ArrowUpTray className="h-4 w-4" />
                    Upload Image
                  </Button>
                </div>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="background">Cover Image</Label>
                <div className="mt-2">
                  {backgroundPreview || formData.background_url ? (
                    <div className="relative w-full h-32 rounded-md overflow-hidden mb-2">
                      <div 
                        className="absolute inset-0 bg-cover bg-center" 
                        style={{ 
                          backgroundImage: `url(${backgroundPreview || formData.background_url})`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                      <Text className="text-ui-fg-subtle">No cover image</Text>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={backgroundInputRef}
                    onChange={(e) => handleFileChange(e, 'background')}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={(e) => triggerFileInput(e, 'background')}
                    className="gap-x-2"
                    type="button" // Explicitly set type to button to prevent form submission
                  >
                    <ArrowUpTray className="h-4 w-4" />
                    Upload Cover Image
                  </Button>
                </div>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={formData.email || ""} 
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  name="website" 
                  value={formData.website || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="https://example.com"
                />
              </div>
            </>
          )
        };
        
      case "bio":
        return {
          title: "Edit Bio",
          subtitle: "Tell others about yourself",
          form: (
            <div className="mb-4">
              <Label htmlFor="bio">About</Label>
              <Textarea 
                id="bio" 
                name="bio" 
                value={formData.bio || ""} 
                onChange={handleChange}
                className="mt-1 min-h-[150px]"
                placeholder="Write a short bio about yourself..."
              />
            </div>
          )
        };
        
      case "work":
        return {
          title: "Edit Work History",
          subtitle: "Manage your work experience",
          form: (
            <div className="mb-4">
              <Text className="mb-4">This will allow you to edit your entire work history.</Text>
              <Text className="text-ui-fg-subtle">Feature coming soon.</Text>
            </div>
          )
        };
        
      case "work-item":
        return {
          title: workItemIndex !== undefined && workItemIndex >= 0 ? "Edit Work Experience" : "Add Work Experience",
          subtitle: "Update your work experience details",
          form: (
            <>
              <div className="mb-4">
                <Label htmlFor="position">Position</Label>
                <Input 
                  id="position" 
                  name="position" 
                  value={formData.position || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  name="company" 
                  value={formData.company || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="years">Years</Label>
                <Input 
                  id="years" 
                  name="years" 
                  value={formData.years || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="2020 - Present"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="respo">Responsibilities</Label>
                <Textarea 
                  id="respo" 
                  name="respo" 
                  value={formData.respo || ""} 
                  onChange={handleChange}
                  className="mt-1 min-h-[100px]"
                  placeholder="Describe your responsibilities and achievements..."
                  required
                />
              </div>
            </>
          )
        };
        
      case "section-edit":
        // Handle section editing - with an initialized sectionData object from the modal
        if (!formData.sectionKey) {
          console.log('No section key provided:', formData);
          return {
            title: "Edit Section",
            subtitle: "Section identifier required",
            form: <div>Cannot edit section: No section identifier provided</div>
          };
        }

        console.log('Rendering section edit form with:', {
          key: formData.sectionKey,
          hasData: !!formData.sectionData,
          fields: formData.sectionData?.fields?.length || 0
        });

        // Format the section title for display
        const sectionTitle = formData.sectionKey.charAt(0).toUpperCase() + 
          formData.sectionKey.slice(1).replace(/_/g, ' ');
        
        // Use the title from data if available, otherwise use formatted section key
        const displayTitle = formData.sectionData?.title || sectionTitle;

        // Use the SectionEditor component with useEffect to load fields
        return {
          title: `Edit ${displayTitle}`,
          subtitle: "Update section information",
          form: <SectionEditor formData={formData} setFormData={setFormData} />
        };
        
      default:
        return {
          title: "Unknown Form Type",
          subtitle: "Please select a valid form type",
          form: <div>Unknown form type</div>
        };
    }
  })()

  // Set hasFileUploads based on form type and data when component mounts
  useEffect(() => {
    // Check if this form type typically has file uploads
    if (formType === 'profile') {
      setHasFileUploads(true);
    } else {
      setHasFileUploads(false);
    }
  }, [formType]);
  
  // We don't render our own FocusModal because we're already inside one from RouteFocusModal
  return (
    <form id="profile-edit-form" onSubmit={handleSubmit} onClick={handleFormClick} className="flex flex-col h-full">
      <FocusModal.Header>
        <div className="flex justify-between w-full">
          <Text className="text-xl font-bold px-4 sm:px-0">{title}</Text>
        </div>
      </FocusModal.Header>
      
      <FocusModal.Body className="flex flex-col items-center py-4 sm:py-8 overflow-y-auto px-4 sm:px-6">
        <div className="flex w-full max-w-md sm:max-w-lg mx-auto flex-col gap-y-6 sm:gap-y-8">
          {subtitle && (
            <div className="flex flex-col gap-y-1">
              <Text className="text-ui-fg-subtle">{subtitle}</Text>
            </div>
          )}
          
          <div className="flex flex-col gap-y-4">
            {form}
          </div>
        </div>
      </FocusModal.Body>
      <FocusModal.Footer className="border-t border-gray-200 p-4 flex justify-end">
        <Button 
          variant="primary" 
          type="submit" 
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (hasFileUploads ? "Uploading..." : "Saving...") : "Save Changes"}
        </Button>
      </FocusModal.Footer>
    </form>
  );
};
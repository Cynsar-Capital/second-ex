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
  
  // Use refs to track the latest values without causing re-renders
  const formDataRef = useRef(formData);
  const setFormDataRef = useRef(setFormData);
  
  // Update refs when props change
  useEffect(() => {
    formDataRef.current = formData;
    setFormDataRef.current = setFormData;
  }, [formData, setFormData]);
  
  // Fetch section fields from the database when component mounts
  useEffect(() => {
    // Create a flag to track if the component is mounted
    let isMounted = true;
    
    const fetchSectionFields = async () => {
      const currentFormData = formDataRef.current;
      
      if (!currentFormData.sectionId && !currentFormData.sectionKey) {
        console.log('No section ID or key provided, using existing data');
        return;
      }
      
      // Avoid duplicate fetches by checking if we already have fields
      if (currentFormData.sectionData?.fields && currentFormData.sectionData.fields.length > 0) {
        console.log('Already have fields data, skipping fetch');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const currentFormData = formDataRef.current;
        console.log('Fetching section fields for:', {
          sectionId: currentFormData.sectionId,
          sectionKey: currentFormData.sectionKey
        });
        
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
        const targetSection = sections.find(section => 
          (currentFormData.sectionId && section.id === currentFormData.sectionId) || 
          (currentFormData.sectionKey && section.section_key === currentFormData.sectionKey)
        );
        
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
            sectionId: targetSection.id, // Ensure we have the ID for later
            sectionKey: targetSection.section_key, // Make sure we have the section key
            sectionData: {
              title: targetSection.title,
              fields: targetSection.fields || []
            }
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
  }, []); 
  
  if (isLoading) {
    return <div className="p-4 text-center">Loading section fields...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Title field - always present for all sections */}
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

      {/* Render fields based on section type */}
      {formData.sectionData.fields && Array.isArray(formData.sectionData.fields) ? (
        // Handle fields array
        <div className="space-y-6">
          {formData.sectionData.fields.map((field: any, index: number) => (
            <div key={field.id || index} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label 
                htmlFor={`field-value-${index}`} 
                className="text-base font-medium mb-2 block"
              >
                {field.field_label || `Field ${index + 1}`}
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
      ) : (
        // Handle object-based section data for simple sections
        <div className="space-y-4">
          {Object.entries(formData.sectionData).map(([key, value]: [string, any]) => {
            // Skip internal keys, id, and title (already handled)
            if (key.startsWith('_') || key === 'id' || key === 'title' || key === 'section_key' || key === 'fields') return null;
            
            const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            
            return (
              <div key={key} className="mb-4">
                <Label htmlFor={key}>{fieldLabel}</Label>
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
                    className="w-full"
                    rows={4}
                  />
                ) : (
                  <Input
                    id={key}
                    value={value}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        sectionData: { ...formData.sectionData, [key]: e.target.value }
                      });
                    }}
                    className="w-full"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};;

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
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(initialData?.background_url || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
    setIsUploading(true);
    
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
        // Prepare the data for section update
        // We need to include the section ID if available for proper updating
        const sectionUpdateData = {
          section_key: formData.sectionKey,
          section_id: formData.sectionId, // This will be set by our SectionEditor component
          title: formData.sectionData.title || '',
          fields: Array.isArray(formData.sectionData.fields) ? formData.sectionData.fields.map((field: any) => ({
            // Ensure all required fields are present
            field_id: field.id || null,
            field_key: field.field_key || field.key || `field_${Math.random().toString(36).substring(2, 9)}`,
            field_label: field.field_label || field.label || 'Untitled Field',
            field_value: field.field_value || field.value || '',
            field_type: field.field_type || field.type || 'text'
          })) : []
        };
        
        console.log('Section edit submitted with data:', sectionUpdateData);
        await onSubmit(sectionUpdateData);
        
        // Manually refresh profile sections data
        if (typeof window !== 'undefined') {
          // @ts-ignore
          if (window.refreshProfileSections && typeof window.refreshProfileSections === 'function') {
            console.log('Calling window.refreshProfileSections() from ProfileEditForms...');
            // @ts-ignore
            window.refreshProfileSections();
          }
        }
        
        // Don't show toast here, let RouteFocusModal handle it
        return;
      }
      
      console.log('Form submitted with data:', dataToSubmit);
      // Call onSubmit with the processed data
      await onSubmit(dataToSubmit);
      
      // Manually refresh profile sections data
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (window.refreshProfileSections && typeof window.refreshProfileSections === 'function') {
          console.log('Calling window.refreshProfileSections() from ProfileEditForms (profile form)...');
          // @ts-ignore
          window.refreshProfileSections();
        }
      }
      
      // Don't show toast here, let RouteFocusModal handle it
    } catch (error) {
      console.error('Error processing form:', error);
      toast.error("Save failed", {
        description: "There was a problem updating your profile. Please try again.",
      });
    } finally {
      setIsUploading(false);
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
        // Handle section editing
        if (!formData.sectionKey || !formData.sectionData) {
          console.log('Section data not found:', formData);
          return {
            title: "Edit Section",
            subtitle: "Update section information",
            form: <div>Section data not found</div>
          };
        }

        console.log('Rendering section edit form with data:', formData);

        // Format the section title for display
        const sectionTitle = formData.sectionKey.charAt(0).toUpperCase() + 
          formData.sectionKey.slice(1).replace(/_/g, ' ');

        // Use the SectionEditor component with useEffect to load fields
        return {
          title: `Edit ${sectionTitle}`,
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
          disabled={isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? "Uploading..." : "Save Changes"}
        </Button>
      </FocusModal.Footer>
    </form>
  );
};
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProfileData } from '@/types/profile';
import { profileKeys } from './use-profile';
import { 
  createProfileSection, 
  deleteProfileSection, 
  updateProfileSection,
  getProfileSectionsWithFields,
  ProfileSection,
  ProfileSectionField,
  NewProfileSection,
  NewProfileSectionField
} from '@/lib/api/profile-sections';

// For backward compatibility with the profile editor components
interface ProfileSectionsMap {
  [key: string]: ProfileSection & { fields: ProfileSectionField[] };
}

export const useProfileSections = () => {
  const queryClient = useQueryClient();
  
  // Query hook to fetch profile sections
  const useFetchProfileSections = (profileId: string) => {
    return useQuery({
      queryKey: ['profileSections', profileId],
      queryFn: async () => {
        console.log(`Fetching profile sections for profile ${profileId}`);
        const { sections, error } = await getProfileSectionsWithFields(profileId);
        
        if (error) {
          console.error('Error fetching profile sections:', error);
          throw error;
        }
        
        return sections;
      },
      enabled: !!profileId
    });
  };
  
  // Update a single profile section
  const updateSection = useMutation({
    mutationFn: async ({ 
      sectionId, 
      sectionData, 
      fields 
    }: { 
      sectionId: string; 
      sectionData: Partial<ProfileSection>; 
      fields: Partial<ProfileSectionField>[] 
    }) => {
      console.log(`Updating section ${sectionId} with fields:`, fields);
      
      // Ensure fields have the correct section_id
      const processedFields = fields.map(field => ({
        ...field,
        section_id: sectionId
      }));
      
      const { error } = await updateProfileSection(sectionId, sectionData, processedFields);
      
      if (error) {
        console.error(`Error updating section ${sectionId}:`, error);
        throw error;
      }
      
      return { sectionId, sectionData, fields: processedFields };
    },
    onSuccess: (data, variables) => {
      toast.success('Section updated successfully');
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['profileSections'],
      });
      
      // Also invalidate the profile queries
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update section', {
        description: error.message || 'Please try again.',
      });
    },
  });
  
  // Create a new profile section
  const createSection = useMutation({
    mutationFn: async ({ 
      profileId, 
      section,
      fields 
    }: { 
      profileId: string; 
      section: Omit<ProfileSection, 'id' | 'fields'>;
      fields: Omit<ProfileSectionField, 'id' | 'section_id'>[]; 
    }) => {
      console.log(`Creating new section for profile ${profileId}:`, { section, fields });
      
      // Prepare the section data
      const newSection: NewProfileSection = {
        title: section.title,
        section_key: section.section_key,
        display_order: section.display_order || 0,
        fields: fields.map((field, index) => ({
          field_key: field.field_key,
          field_label: field.field_label,
          field_value: field.field_value,
          field_type: field.field_type,
          display_order: field.display_order || index
        }))
      };
      
      const { section: createdSection, error } = await createProfileSection(profileId, newSection);
      
      if (error) {
        console.error('Error creating section:', error);
        throw error;
      }
      
      return createdSection;
    },
    onSuccess: (data, variables) => {
      toast.success('Section created successfully');
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['profileSections', variables.profileId],
      });
      
      // Also invalidate the profile queries
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create section', {
        description: error.message || 'Please try again.',
      });
    },
  });
  
  // Delete a profile section
  const deleteSection = useMutation({
    mutationFn: async ({ sectionId }: { sectionId: string }) => {
      console.log(`Deleting section ${sectionId}`);
      
      const { error } = await deleteProfileSection(sectionId);
      
      if (error) {
        console.error(`Error deleting section ${sectionId}:`, error);
        throw error;
      }
      
      return { sectionId };
    },
    onSuccess: (data, variables) => {
      toast.success('Section deleted successfully');
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['profileSections'],
      });
      
      // Also invalidate the profile queries
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete section', {
        description: error.message || 'Please try again.',
      });
    },
  });
  
  // For bulk operations on multiple sections
  const bulkUpdateSections = useMutation({
    mutationFn: async ({ 
      profileId, 
      sections 
    }: { 
      profileId: string; 
      sections: ProfileSection[] 
    }) => {
      console.log(`Bulk updating sections for profile ${profileId}:`, sections);
      
      // Process each section separately
      const results = await Promise.all(sections.map(async (section) => {
        if (!section.id) {
          throw new Error(`Section must have an ID for bulk update: ${section.title}`);
        }
        
        const sectionData: Partial<ProfileSection> = {
          title: section.title,
          section_key: section.section_key,
          display_order: section.display_order || 0
        };
        
        const fields = section.fields?.map((field: ProfileSectionField) => ({
          id: field.id,
          field_key: field.field_key,
          field_label: field.field_label,
          field_value: field.field_value,
          field_type: field.field_type,
          display_order: field.display_order || 0
        })) || [];
        
        return updateProfileSection(section.id, sectionData, fields);
      }));
      
      // Check for errors
      const errors = results.filter(result => result.error).map(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Errors updating sections: ${errors.join(', ')}`);
      }
      
      return { success: true, count: sections.length };
    },
    onSuccess: (data, variables) => {
      toast.success(`Updated ${data.count} profile sections successfully`);
      
      // Invalidate all profile section queries
      queryClient.invalidateQueries({
        queryKey: ['profileSections', variables.profileId],
      });
      
      // Also invalidate the profile queries
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update profile sections', {
        description: error.message || 'Please try again.',
      });
    },
  });
  
  return {
    useFetchProfileSections,
    updateSection,
    createSection,
    deleteSection,
    bulkUpdateSections
  };
};
